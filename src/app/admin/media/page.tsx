import { FormSelect } from "@/components/admin/form-select";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { AdminPagination, parseTablePagination } from "@/components/admin/data-table";
import { SubmitButton } from "@/components/admin/submit-button";
export const instant = false;
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateMediaMetadataAction } from "./actions";

export default async function MediaAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; uploaded?: string; error?: string; page?: string; pageSize?: string }> }) {
  const staff = await requireStaff(); const params = await searchParams; const { page, pageSize } = parseTablePagination(params);
  const supabase = await createSupabaseServerClient();
  const [{ data: assets, count, error }, { data: categories }] = await Promise.all([
    supabase.from("media_assets").select("id, object_path, kind, mime_type, byte_size, alt_text, category_id, is_approved, is_public, contains_pupils, uploaded_by_id, created_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1),
    supabase.from("media_categories").select("id, name").order("name"),
  ]);
  const canEdit = staff.roles.includes("EDITOR") || staff.roles.includes("SUPER_ADMIN");
  const uploadErrors: Record<string, string> = { validation: "Choose a supported file under 8 MB and complete the required fields.", bucket: "Private media storage is not available. Check the configured Storage bucket.", upload: "Upload was rejected by Storage. Please check the server logs and your staff upload permissions.", record: "The file uploaded, but its database registration failed. The upload was rolled back." };
  return <AdminShell title="Media Library" staff={staff} breadcrumbs={[{ label: "Media Library" }]}>
    <p className="mb-6 border-l-4 border-accent-gold bg-white p-4 text-sm">Upload images and PDF documents to private storage. Public approval and publishing remain disabled pending consent and secure-delivery validation. Never upload pupil images without appropriate authorization.</p>
    {params.uploaded && <p role="status" className="mb-4 border bg-white p-3 text-sm">Media uploaded privately and registered successfully.</p>}
    {params.saved && <p role="status" className="mb-4 border bg-white p-3 text-sm">Media metadata saved.</p>}
    {(params.error || error) && <p role="alert" className="mb-4 border border-destructive bg-white p-3 text-sm">{error ? "Media records could not be loaded. Check database permissions and server logs." : uploadErrors[params.error ?? ""] ?? "Unable to update media metadata. Please try again."}</p>}
    {canEdit && <MediaUploadForm categories={categories ?? []} />}
    {!error && (assets?.length ? <div className="grid gap-5 lg:grid-cols-2">{assets.map((asset) => {
      const editable = canEdit && !asset.is_approved && (staff.roles.includes("SUPER_ADMIN") || asset.uploaded_by_id === staff.profileId);
      return <article key={asset.id} className="border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><h2 className="break-all font-heading text-base font-bold text-brand-900">{asset.object_path}</h2><p className="mt-1 text-xs text-muted-foreground">{asset.kind} · {asset.mime_type} · {(asset.byte_size / 1024).toFixed(1)} KB</p></div><span className="text-xs font-bold text-brand-800">{asset.is_public ? "Public flag" : asset.is_approved ? "Approved" : "Unapproved"}</span></div><p className="mt-3 text-xs">{asset.contains_pupils ? "Contains pupils — consent required" : "No pupils flagged"}</p><form action={updateMediaMetadataAction} className="mt-4 space-y-3 border-t pt-4"><input type="hidden" name="id" value={asset.id} /><div><label htmlFor={`alt-${asset.id}`} className="text-sm font-bold">Alternative text</label><textarea id={`alt-${asset.id}`} name="alt_text" defaultValue={asset.alt_text ?? ""} maxLength={500} disabled={!editable} rows={2} className="mt-2 w-full border p-2 text-sm disabled:bg-background-warm" /></div><FormSelect name="category_id" label="Category" defaultValue={asset.category_id ?? ""} disabled={!editable} options={[{ value: "", label: "Uncategorized" }, ...(categories ?? []).map(category => ({ value: category.id, label: category.name }))]} />{editable ? <SubmitButton className="bg-brand-800 px-4 py-2 text-sm font-bold text-white">Save metadata</SubmitButton> : <p className="text-xs text-muted-foreground">Read-only: approved asset or insufficient permissions.</p>}</form></article>;
    })}<AdminPagination basePath="/admin/media" params={{}} page={page} pageSize={pageSize} total={count ?? 0} /></div> : <AdminEmptyState title="No media assets" description="No files have been registered yet. Use the upload area above to add the first private media asset." />)}
  </AdminShell>;
}
