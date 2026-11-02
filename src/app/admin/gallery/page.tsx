import Link from "next/link";
import { GalleryCategoryManager } from "@/components/admin/gallery-category-manager";
import { GalleryFilters } from "@/components/admin/gallery-filters";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const instant = false;
export const metadata = { title: "Gallery management | St. Angella" };

export default async function AdminGalleryPage({searchParams}:{searchParams:Promise<{categories?:string; q?:string; category?:string; status?:string; page?:string}>}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: categories, error: categoriesError } = await supabase.from("media_categories").select("id,name,slug").order("name");
  const categoryNames = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const search = (params.q ?? "").trim().slice(0,80).replace(/[%_,]/g, "");
  const category = (params.category ?? "").trim();
  const status = ["published","approved","pending"].includes(params.status ?? "") ? params.status! : "";
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage,100000) : 1;
  const pageSize = 24;
  const buildQuery = () => {
    let query = supabase.from("media_assets").select("id,alt_text,category_id,is_approved,is_public,contains_pupils,uploaded_by_id,created_at", {count:"exact"}).eq("kind","IMAGE").eq("show_in_gallery",true);
    if (search) query = query.ilike("alt_text", `%${search}%`);
    if (category === "uncategorized") query = query.is("category_id",null);
    else if (categories?.some(c => c.id === category)) query = query.eq("category_id",category);
    if (status === "published") query = query.eq("is_public",true).eq("is_approved",true);
    if (status === "approved") query = query.eq("is_approved",true).eq("is_public",false);
    if (status === "pending") query = query.eq("is_approved",false);
    return query;
  };
  const [{data:images,count,error},{count:totalCount},{count:publishedCount},{count:pendingCount}] = await Promise.all([
    buildQuery().order("created_at",{ascending:false}).order("id",{ascending:false}).range((page-1)*pageSize,page*pageSize-1),
    supabase.from("media_assets").select("id",{count:"exact",head:true}).eq("kind","IMAGE").eq("show_in_gallery",true),
    supabase.from("media_assets").select("id",{count:"exact",head:true}).eq("kind","IMAGE").eq("show_in_gallery",true).eq("is_public",true).eq("is_approved",true),
    supabase.from("media_assets").select("id",{count:"exact",head:true}).eq("kind","IMAGE").eq("show_in_gallery",true).eq("is_approved",false),
  ]);
  const total = totalCount ?? 0;
  const published = publishedCount ?? 0;
  const pending = pendingCount ?? 0;
  const pages = Math.max(1,Math.ceil((count ?? 0)/pageSize));
  const pageUrl = (nextPage:number) => {
    const qs = new URLSearchParams();
    if(search) qs.set("q",search);
    if(category) qs.set("category",category);
    if(status) qs.set("status",status);
    qs.set("page",String(nextPage));
    return `/admin/gallery?${qs.toString()}`;
  };
  return <AdminShell title="Gallery" staff={staff} breadcrumbs={[{ label: "Gallery" }]}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-2xl text-sm text-muted-foreground">Only images explicitly selected for the Gallery appear here. Manage image approval, public access, categories and Gallery placement in the Media Library.</p>
      <div className="flex gap-2"><Link href="/gallery" className="border border-brand-800 px-4 py-2 text-sm font-bold text-brand-800">View public gallery</Link><Link href="/admin/media" className="bg-brand-800 px-4 py-2 text-sm font-bold text-white">Manage media</Link></div>
    </div>
    <section aria-label="Gallery summary" className="mb-6 grid gap-px border bg-border sm:grid-cols-3">
      {[["Gallery selections", total],["Published", published],["Awaiting approval", pending]].map(([label,value]) => <div key={label} className="bg-white p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-heading text-3xl font-bold text-brand-900">{value}</p></div>)}
    </section>
    <p className="mb-6 border-l-4 border-accent-gold bg-white p-4 text-sm">Only approved, public images with valid required consent can appear in the Gallery. Other public media may be used in News and Events without appearing here. Withdrawing consent must prevent further delivery of affected pupil images.</p>
    {params.categories === "updated" && <p role="status" className="mb-4 border bg-white p-3 text-sm">Category changes saved.</p>}
    {params.categories === "inuse" && <p role="alert" className="mb-4 border border-destructive bg-white p-3 text-sm">This category is in use. Reassign its images before deleting it.</p>}
    {params.categories === "invalid" && <p role="alert" className="mb-4 border border-destructive bg-white p-3 text-sm">Enter a valid category name (2–70 characters).</p>}
    {params.categories === "failed" && <p role="alert" className="mb-4 border border-destructive bg-white p-3 text-sm">Category operation failed. The name may already exist or your permissions may be insufficient.</p>}
    <GalleryCategoryManager categories={categories ?? []} canManage={staff.roles.includes("SUPER_ADMIN")} />
    <section aria-labelledby="gallery-images-heading" className="mb-5">
      <h2 id="gallery-images-heading" className="mb-3 font-heading text-xl font-bold text-brand-900">Gallery images</h2>
      <GalleryFilters categories={categories ?? []} search={search} category={category} status={status} />
      <p role="status" className="mt-3 text-sm text-muted-foreground">{count ?? 0} matching images · Page {page} of {pages}</p>
      {categoriesError && <p role="alert" className="mt-2 text-sm text-destructive">Categories could not be loaded.</p>}
    </section>
    {error ? <p role="alert" className="border p-5">Gallery images could not be loaded. Verify staff access and database permissions.</p> :
      !images?.length ? <div className="border bg-white p-10 text-center"><h2 className="font-heading text-xl font-bold text-brand-900">No Gallery images selected</h2><p className="mt-2 text-sm text-muted-foreground">Open Media Library, approve and publish a photograph, then enable Show in public Gallery in its Media Details.</p><Link href="/admin/media" className="mt-5 inline-block bg-brand-800 px-5 py-3 text-sm font-bold text-white">Open Media Library</Link></div> :
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{images.map((item) => <article key={item.id} className="border bg-white">
        <img src={`/admin/media/preview/${item.id}`} alt={item.alt_text || "Private gallery image awaiting description"} loading="lazy" className="aspect-[4/3] w-full border-b object-cover" />
        <div className="space-y-2 p-4"><p className="text-sm font-semibold text-brand-900">{item.alt_text || "Alternative text required"}</p><p className="text-xs text-muted-foreground">{categoryNames.get(item.category_id ?? "") ?? "Uncategorized"}</p><div className="flex flex-wrap gap-2 text-xs"><span className="border px-2 py-1">{item.is_public ? "Published" : item.is_approved ? "Approved · Private" : "Pending approval"}</span>{item.contains_pupils && <span className="border px-2 py-1">Pupil consent required</span>}</div><Link href="/admin/media" className="inline-block border border-brand-800 px-3 py-2 text-xs font-bold text-brand-800">Review in Media Library</Link></div>
      </article>)}</div>}
    {!error && pages > 1 && <nav aria-label="Gallery pages" className="mt-5 flex items-center justify-between border bg-white p-4"><span className="text-sm">Page {page} of {pages}</span><div className="flex gap-2">{page > 1 && <Link href={pageUrl(page-1)} className="border px-4 py-2 text-sm">Previous</Link>}{page < pages && <Link href={pageUrl(page+1)} className="border px-4 py-2 text-sm">Next</Link>}</div></nav>}
  </AdminShell>;
}
