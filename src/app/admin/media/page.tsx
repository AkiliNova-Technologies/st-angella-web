import { FileText, ImageIcon, ShieldCheck, ShieldAlert } from "lucide-react";
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
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-xl font-bold text-brand-900">Your media</h2><p className="mt-1 text-sm text-muted-foreground">{count ?? 0} registered assets · Private storage</p></div>{canEdit && <a href="#upload-media" className="border border-brand-800 bg-brand-800 px-4 py-2 text-sm font-semibold text-white">Upload media</a>}</div>
    {canEdit && <details id="upload-media" className="mb-7 border bg-white"><summary className="cursor-pointer px-5 py-4 font-semibold text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-800">Upload a new image or document</summary><div className="border-t p-5"><MediaUploadForm categories={categories ?? []} /></div></details>}
    {!error && (assets?.length ? <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{assets.map((asset) => {
      const editable = canEdit && !asset.is_approved && (staff.roles.includes("SUPER_ADMIN") || asset.uploaded_by_id === staff.profileId);
      const filename = asset.object_path.split("/").at(-1) ?? "Media file";
      const categoryName = categories?.find(category => category.id === asset.category_id)?.name ?? "Uncategorized";
      return <article key={asset.id} className="min-w-0 overflow-hidden border border-border bg-white">
        <div className="flex aspect-[4/3] items-center justify-center border-b bg-background-warm" aria-label={asset.kind === "IMAGE" ? "Private image; preview unavailable" : "Document"}>
          {asset.kind === "IMAGE" ? <ImageIcon aria-hidden="true" className="size-14 text-brand-800/60" /> : <FileText aria-hidden="true" className="size-14 text-brand-800/60" />}
        </div>
        <div className="space-y-3 p-4">
          <div><h3 title={filename} className="truncate font-semibold text-brand-900">{filename}</h3><p className="mt-1 text-xs text-muted-foreground">{categoryName} · {(asset.byte_size / 1024 / 1024).toFixed(2)} MB · {new Date(asset.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}</p></div>
          <div className="flex flex-wrap gap-2 text-xs"><span className="border px-2 py-1 font-semibold text-brand-800">{asset.is_approved ? "Approved" : "Pending approval"}</span><span className="inline-flex items-center gap-1 border px-2 py-1">{asset.contains_pupils ? <ShieldAlert className="size-3" aria-hidden="true" /> : <ShieldCheck className="size-3" aria-hidden="true" />}{asset.contains_pupils ? "Pupil consent required" : "Private"}</span></div>
          <details className="border-t pt-3"><summary className="cursor-pointer text-sm font-semibold text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-800">Details and metadata</summary>
            <form action={updateMediaMetadataAction} className="mt-4 space-y-3"><input type="hidden" name="id" value={asset.id} /><div><label htmlFor={`alt-${asset.id}`} className="text-sm font-bold">Alternative text</label><textarea id={`alt-${asset.id}`} name="alt_text" defaultValue={asset.alt_text ?? ""} maxLength={500} disabled={!editable} rows={2} className="mt-2 w-full border p-2 text-sm disabled:bg-background-warm" /></div><FormSelect name="category_id" label="Category" defaultValue={asset.category_id ?? ""} disabled={!editable} options={[{ value: "", label: "Uncategorized" }, ...(categories ?? []).map(category => ({ value: category.id, label: category.name }))]} />{editable ? <SubmitButton className="bg-brand-800 px-4 py-2 text-sm font-bold text-white">Save metadata</SubmitButton> : <p className="text-xs text-muted-foreground">Read-only: approved asset or insufficient permissions.</p>}</form>
          </details>
        </div>
      </article>;
    })}</div><div className="mt-5 border bg-white"><AdminPagination basePath="/admin/media" params={{}} page={page} pageSize={pageSize} total={count ?? 0} /></div></> : <AdminEmptyState title="No media assets" description="No files have been registered yet. Open the upload section to add your first private media asset." />)}
  </AdminShell>;
}
