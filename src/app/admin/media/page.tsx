import { SubmitButton } from "@/components/admin/submit-button";
export const instant = false;
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateMediaMetadataAction } from "./actions";

export default async function MediaAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const staff = await requireStaff(); const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: assets, error }, { data: categories }] = await Promise.all([
    supabase.from("media_assets").select("id, object_path, kind, mime_type, byte_size, alt_text, category_id, is_approved, is_public, contains_pupils, uploaded_by_id, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("media_categories").select("id, name").order("name"),
  ]);
  const canEdit = staff.roles.includes("EDITOR") || staff.roles.includes("SUPER_ADMIN");
  return <AdminShell title="Media Library" staff={staff} breadcrumbs={[{ label: "Media Library" }]}>
    <p className="mb-6 border-l-4 border-accent-gold bg-white p-4 text-sm">Media storage is private. This screen manages registered media metadata; uploads and public approval remain disabled until the consent and secure-delivery workflows are validated. Pupil images must never be made public without eligible consent.</p>
    {params.saved && <p role="status" className="mb-4 border bg-white p-3 text-sm">Media metadata saved.</p>}
    {(params.error || error) && <p role="alert" className="mb-4 border border-destructive bg-white p-3 text-sm">Unable to load or update media.</p>}
    {!error && (assets?.length ? <div className="grid gap-5 lg:grid-cols-2">{assets.map((asset) => {
      const editable = canEdit && !asset.is_approved && (staff.roles.includes("SUPER_ADMIN") || asset.uploaded_by_id === staff.profileId);
      return <article key={asset.id} className="border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><h2 className="break-all font-heading text-base font-bold text-brand-900">{asset.object_path}</h2><p className="mt-1 text-xs text-muted-foreground">{asset.kind} · {asset.mime_type} · {(asset.byte_size / 1024).toFixed(1)} KB</p></div><span className="text-xs font-bold text-brand-800">{asset.is_public ? "Public flag" : asset.is_approved ? "Approved" : "Unapproved"}</span></div><p className="mt-3 text-xs">{asset.contains_pupils ? "Contains pupils — consent required" : "No pupils flagged"}</p><form action={updateMediaMetadataAction} className="mt-4 space-y-3 border-t pt-4"><input type="hidden" name="id" value={asset.id} /><div><label htmlFor={`alt-${asset.id}`} className="text-sm font-bold">Alternative text</label><textarea id={`alt-${asset.id}`} name="alt_text" defaultValue={asset.alt_text ?? ""} maxLength={500} disabled={!editable} rows={2} className="mt-2 w-full border p-2 text-sm disabled:bg-background-warm" /></div><div><label htmlFor={`category-${asset.id}`} className="text-sm font-bold">Category</label><select id={`category-${asset.id}`} name="category_id" defaultValue={asset.category_id ?? ""} disabled={!editable} className="mt-2 min-h-11 w-full border bg-white px-2 text-sm disabled:bg-background-warm"><option value="">Uncategorized</option>{(categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>{editable ? <SubmitButton className="bg-brand-800 px-4 py-2 text-sm font-bold text-white">Save metadata</SubmitButton> : <p className="text-xs text-muted-foreground">Read-only: approved asset or insufficient permissions.</p>}</form></article>;
    })}</div> : <AdminEmptyState title="No media assets" description="Registered media assets will appear here when secure uploads are enabled." />)}
  </AdminShell>;
}
