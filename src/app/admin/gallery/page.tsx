import Link from "next/link";
import { createGalleryCategoryAction, renameGalleryCategoryAction, deleteGalleryCategoryAction } from "./actions";
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
    let query = supabase.from("media_assets").select("id,alt_text,category_id,is_approved,is_public,contains_pupils,uploaded_by_id,created_at", {count:"exact"}).eq("kind","IMAGE");
    if (search) query = query.ilike("alt_text", `%${search}%`);
    if (category === "uncategorized") query = query.is("category_id",null);
    else if (categories?.some(c => c.id === category)) query = query.eq("category_id",category);
    if (status === "published") query = query.eq("is_public",true);
    if (status === "approved") query = query.eq("is_approved",true).eq("is_public",false);
    if (status === "pending") query = query.eq("is_approved",false);
    return query;
  };
  const [{data:images,count,error},{count:totalCount},{count:publishedCount},{count:pendingCount}] = await Promise.all([
    buildQuery().order("created_at",{ascending:false}).order("id",{ascending:false}).range((page-1)*pageSize,page*pageSize-1),
    supabase.from("media_assets").select("id",{count:"exact",head:true}).eq("kind","IMAGE"),
    supabase.from("media_assets").select("id",{count:"exact",head:true}).eq("kind","IMAGE").eq("is_public",true),
    supabase.from("media_assets").select("id",{count:"exact",head:true}).eq("kind","IMAGE").eq("is_approved",false),
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
      <p className="max-w-2xl text-sm text-muted-foreground">Manage photographs used on the public gallery. Upload, metadata editing, consent verification, approval and publication are handled in the Media Library.</p>
      <div className="flex gap-2"><Link href="/gallery" className="border border-brand-800 px-4 py-2 text-sm font-bold text-brand-800">View public gallery</Link><Link href="/admin/media" className="bg-brand-800 px-4 py-2 text-sm font-bold text-white">Manage media</Link></div>
    </div>
    <section aria-label="Gallery summary" className="mb-6 grid gap-px border bg-border sm:grid-cols-3">
      {[["Gallery images", total],["Published", published],["Awaiting approval", pending]].map(([label,value]) => <div key={label} className="bg-white p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-heading text-3xl font-bold text-brand-900">{value}</p></div>)}
    </section>
    <p className="mb-6 border-l-4 border-accent-gold bg-white p-4 text-sm">Only approved, public images with valid required consent can appear on the public website. Withdrawing consent must prevent further delivery of affected pupil images.</p>
    <section className="mb-8 border bg-white p-5" aria-labelledby="gallery-categories-heading">
      <div className="mb-4"><h2 id="gallery-categories-heading" className="font-heading text-xl font-bold text-brand-900">Gallery categories</h2><p className="mt-1 text-sm text-muted-foreground">Organize school photographs by activity or location. Only super administrators can change categories.</p></div>
      {params.categories === "updated" && <p role="status" className="mb-4 border p-3 text-sm">Category changes saved.</p>}
      {params.categories === "inuse" && <p role="alert" className="mb-4 border border-destructive p-3 text-sm">This category is in use. Reassign its images before deleting it.</p>}
      {params.categories === "invalid" && <p role="alert" className="mb-4 border border-destructive p-3 text-sm">Enter a valid category name (2–70 characters).</p>}
      {params.categories === "failed" && <p role="alert" className="mb-4 border border-destructive p-3 text-sm">Category operation failed. The name may already exist or your permissions may be insufficient.</p>}
      {staff.roles.includes("SUPER_ADMIN") && <form action={createGalleryCategoryAction} className="mb-5 flex flex-wrap gap-2"><label htmlFor="new-gallery-category" className="sr-only">New category name</label><input id="new-gallery-category" name="name" required minLength={2} maxLength={70} placeholder="New category name" className="min-h-11 flex-1 border px-3 text-sm"/><button className="bg-brand-800 px-4 py-2 text-sm font-bold text-white">Add category</button></form>}
      <div className="divide-y border">{(categories ?? []).map(category => <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
        {staff.roles.includes("SUPER_ADMIN") ? <><form action={renameGalleryCategoryAction} className="flex min-w-0 flex-1 flex-wrap gap-2"><input type="hidden" name="id" value={category.id}/><label htmlFor={`category-${category.id}`} className="sr-only">Rename {category.name}</label><input id={`category-${category.id}`} name="name" required minLength={2} maxLength={70} defaultValue={category.name} className="min-h-10 min-w-0 flex-1 border px-3 text-sm"/><button className="border border-brand-800 px-3 py-2 text-xs font-bold text-brand-800">Save</button></form><form action={deleteGalleryCategoryAction}><input type="hidden" name="id" value={category.id}/><button className="border border-destructive px-3 py-2 text-xs font-bold text-destructive">Delete</button></form></> : <span className="text-sm font-semibold">{category.name}</span>}
      </div>)}{!categories?.length && <p className="p-4 text-sm text-muted-foreground">No categories have been configured.</p>}</div>
    </section>
    <section aria-labelledby="gallery-images-heading" className="mb-5">
      <h2 id="gallery-images-heading" className="mb-3 font-heading text-xl font-bold text-brand-900">Gallery images</h2>
      <form method="get" action="/admin/gallery" className="grid gap-3 border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div><label htmlFor="gallery-search" className="mb-1 block text-sm font-semibold">Search descriptions</label><input id="gallery-search" name="q" defaultValue={search} maxLength={80} placeholder="Search images" className="min-h-11 w-full border px-3 text-sm"/></div>
        <div><label htmlFor="gallery-category-filter" className="mb-1 block text-sm font-semibold">Category</label><select id="gallery-category-filter" name="category" defaultValue={category} className="min-h-11 w-full border bg-white px-3 text-sm"><option value="">All categories</option><option value="uncategorized">Uncategorized</option>{(categories ?? []).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label htmlFor="gallery-status-filter" className="mb-1 block text-sm font-semibold">Publication status</label><select id="gallery-status-filter" name="status" defaultValue={status} className="min-h-11 w-full border bg-white px-3 text-sm"><option value="">All statuses</option><option value="pending">Pending approval</option><option value="approved">Approved, private</option><option value="published">Published</option></select></div>
        <div className="flex items-end gap-2"><button className="min-h-11 flex-1 bg-brand-800 px-4 text-sm font-bold text-white">Apply filters</button><Link href="/admin/gallery" className="flex min-h-11 items-center border px-3 text-sm font-semibold">Clear</Link></div>
      </form>
      <p role="status" className="mt-3 text-sm text-muted-foreground">{count ?? 0} matching images · Page {page} of {pages}</p>
      {categoriesError && <p role="alert" className="mt-2 text-sm text-destructive">Categories could not be loaded.</p>}
    </section>
    {error ? <p role="alert" className="border p-5">Gallery images could not be loaded. Verify staff access and database permissions.</p> :
      !images?.length ? <div className="border bg-white p-10 text-center"><h2 className="font-heading text-xl font-bold text-brand-900">No matching gallery images</h2><p className="mt-2 text-sm text-muted-foreground">Upload school photographs privately in the Media Library, then complete independent review before publishing.</p><Link href="/admin/media" className="mt-5 inline-block bg-brand-800 px-5 py-3 text-sm font-bold text-white">Open Media Library</Link></div> :
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{images.map((item) => <article key={item.id} className="border bg-white">
        <img src={`/admin/media/preview/${item.id}`} alt={item.alt_text || "Private gallery image awaiting description"} loading="lazy" className="aspect-[4/3] w-full border-b object-cover" />
        <div className="space-y-2 p-4"><p className="text-sm font-semibold text-brand-900">{item.alt_text || "Alternative text required"}</p><p className="text-xs text-muted-foreground">{categoryNames.get(item.category_id ?? "") ?? "Uncategorized"}</p><div className="flex flex-wrap gap-2 text-xs"><span className="border px-2 py-1">{item.is_public ? "Published" : item.is_approved ? "Approved · Private" : "Pending approval"}</span>{item.contains_pupils && <span className="border px-2 py-1">Pupil consent required</span>}</div><Link href="/admin/media" className="inline-block border border-brand-800 px-3 py-2 text-xs font-bold text-brand-800">Review in Media Library</Link></div>
      </article>)}</div>}
    {!error && pages > 1 && <nav aria-label="Gallery pages" className="mt-5 flex items-center justify-between border bg-white p-4"><span className="text-sm">Page {page} of {pages}</span><div className="flex gap-2">{page > 1 && <Link href={pageUrl(page-1)} className="border px-4 py-2 text-sm">Previous</Link>}{page < pages && <Link href={pageUrl(page+1)} className="border px-4 py-2 text-sm">Next</Link>}</div></nav>}
  </AdminShell>;
}
