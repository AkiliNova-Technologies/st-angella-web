import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const instant = false;
export const metadata = { title: "Gallery management | St. Angella" };

export default async function AdminGalleryPage() {
  const staff = await requireStaff();
  const supabase = await createSupabaseServerClient();
  const { data: images, error } = await supabase.from("media_assets")
    .select("id,alt_text,category_id,is_approved,is_public,contains_pupils,uploaded_by_id,created_at")
    .eq("kind", "IMAGE").order("created_at", { ascending: false }).limit(120);
  const { data: categories } = await supabase.from("media_categories").select("id,name").order("name");
  const categoryNames = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const total = images?.length ?? 0;
  const published = images?.filter((image) => image.is_public).length ?? 0;
  const pending = images?.filter((image) => !image.is_approved).length ?? 0;
  return <AdminShell title="Gallery" staff={staff} breadcrumbs={[{ label: "Gallery" }]}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-2xl text-sm text-muted-foreground">Manage photographs used on the public gallery. Upload, metadata editing, consent verification, approval and publication are handled in the Media Library.</p>
      <div className="flex gap-2"><Link href="/gallery" className="border border-brand-800 px-4 py-2 text-sm font-bold text-brand-800">View public gallery</Link><Link href="/admin/media" className="bg-brand-800 px-4 py-2 text-sm font-bold text-white">Manage media</Link></div>
    </div>
    <section aria-label="Gallery summary" className="mb-6 grid gap-px border bg-border sm:grid-cols-3">
      {[["Gallery images", total],["Published", published],["Awaiting approval", pending]].map(([label,value]) => <div key={label} className="bg-white p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-heading text-3xl font-bold text-brand-900">{value}</p></div>)}
    </section>
    <p className="mb-6 border-l-4 border-accent-gold bg-white p-4 text-sm">Only approved, public images with valid required consent can appear on the public website. Withdrawing consent must prevent further delivery of affected pupil images.</p>
    {error ? <p role="alert" className="border p-5">Gallery images could not be loaded. Verify staff access and database permissions.</p> :
      !images?.length ? <div className="border bg-white p-10 text-center"><h2 className="font-heading text-xl font-bold text-brand-900">No gallery images yet</h2><p className="mt-2 text-sm text-muted-foreground">Upload school photographs privately in the Media Library, then complete independent review before publishing.</p><Link href="/admin/media" className="mt-5 inline-block bg-brand-800 px-5 py-3 text-sm font-bold text-white">Open Media Library</Link></div> :
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{images.map((item) => <article key={item.id} className="border bg-white">
        <img src={`/admin/media/preview/${item.id}`} alt={item.alt_text || "Private gallery image awaiting description"} loading="lazy" className="aspect-[4/3] w-full border-b object-cover" />
        <div className="space-y-2 p-4"><p className="text-sm font-semibold text-brand-900">{item.alt_text || "Alternative text required"}</p><p className="text-xs text-muted-foreground">{categoryNames.get(item.category_id ?? "") ?? "Uncategorized"}</p><div className="flex flex-wrap gap-2 text-xs"><span className="border px-2 py-1">{item.is_public ? "Published" : item.is_approved ? "Approved · Private" : "Pending approval"}</span>{item.contains_pupils && <span className="border px-2 py-1">Pupil consent required</span>}</div><Link href="/admin/media" className="inline-block border border-brand-800 px-3 py-2 text-xs font-bold text-brand-800">Review in Media Library</Link></div>
      </article>)}</div>}
  </AdminShell>;
}
