"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updateMediaMetadataAction(formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "media:manage") || (!staff.roles.includes("EDITOR") && !staff.roles.includes("SUPER_ADMIN"))) redirect("/admin/forbidden");
  const values = z.object({ id: z.string().uuid(), alt_text: z.string().trim().max(500), category_id: z.union([z.literal(""), z.string().uuid()]) }).safeParse(Object.fromEntries(formData));
  if (!values.success) redirect("/admin/media?error=1");
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.from("media_assets").select("id, uploaded_by_id, is_approved").eq("id", values.data.id).single();
  if (!current || current.is_approved || (current.uploaded_by_id !== staff.profileId && !staff.roles.includes("SUPER_ADMIN"))) redirect("/admin/forbidden");
  const { data, error } = await supabase.from("media_assets").update({ alt_text: values.data.alt_text || null, category_id: values.data.category_id || null }).eq("id", current.id).eq("is_approved", false).select("id").single();
  if (error || !data) redirect("/admin/media?error=1");
  revalidatePath("/admin/media");
  redirect("/admin/media?saved=1");
}

const uploadSchema = z.object({
  alt_text: z.string().trim().max(500),
  category_id: z.union([z.literal(""), z.string().uuid()]),
  contains_pupils: z.enum(["yes", "no"]),
});
const ALLOWED = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["application/pdf", "pdf"]]);
const MAX_UPLOAD = 8 * 1024 * 1024;

export async function uploadMediaAction(formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "media:manage") || !staff.roles.some(role => role === "EDITOR" || role === "SUPER_ADMIN")) redirect("/admin/forbidden");
  const file = formData.get("file");
  const parsed = uploadSchema.safeParse({
    alt_text: formData.get("alt_text"),
    category_id: formData.get("category_id"),
    contains_pupils: formData.get("contains_pupils"),
  });
  if (!parsed.success || !(file instanceof File) || file.size < 1 || file.size > MAX_UPLOAD || !ALLOWED.has(file.type)) redirect("/admin/media?error=validation");
  const bucket = process.env.MEDIA_PRIVATE_BUCKET || "school-photography";
  const supabase = await createSupabaseServerClient();
  // Bucket is selected from a fixed allowlist of provisioned private buckets.
  // Authenticated staff cannot necessarily call getBucket (bucket metadata is not public).
  // Storage INSERT policy enforces the bucket and user-scoped path.
  if (!["school-photography", "news-images", "gallery-images", "brand-assets"].includes(bucket)) redirect("/admin/media?error=bucket");
  const extension = ALLOWED.get(file.type)!;
  const objectPath = `${staff.userId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file, { contentType: file.type, upsert: false, cacheControl: "private, max-age=0" });
  if (uploadError) { console.error("Private media upload failed", { code: uploadError.name, message: uploadError.message }); redirect("/admin/media?error=upload"); }
  const { error: recordError } = await supabase.from("media_assets").insert({
    bucket, object_path: objectPath, kind: file.type === "application/pdf" ? "DOCUMENT" : "IMAGE",
    mime_type: file.type, byte_size: file.size, alt_text: parsed.data.alt_text || null,
    category_id: parsed.data.category_id || null, uploaded_by_id: staff.profileId,
    contains_pupils: parsed.data.contains_pupils === "yes", is_approved: false, is_public: false,
  });
  if (recordError) {
    await supabase.storage.from(bucket).remove([objectPath]);
    console.error("Media registration failed", { code: recordError.code, message: recordError.message });
    redirect("/admin/media?error=record");
  }
  revalidatePath("/admin/media");
  redirect("/admin/media?uploaded=1");
}

export async function deleteUnusedMediaAction(formData: FormData) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  const parsed = z.string().uuid().safeParse(formData.get("id"));
  if (!parsed.success) redirect("/admin/media?error=validation");
  const admin = createSupabaseAdminClient();
  const { data: asset, error } = await admin.from("media_assets").select("id,bucket,object_path,is_approved,is_public").eq("id",parsed.data).single();
  if (error || !asset) redirect("/admin/media?error=notfound");
  if (asset.is_approved || asset.is_public) redirect("/admin/media?error=protected");
  // Fail closed: permanent storage deletion is disabled until reference checks
  // and database/storage cleanup can be performed as a recoverable workflow.
  // Existing media records and storage objects remain untouched.
  redirect("/admin/media?error=deletion_disabled");
  revalidatePath("/admin/media");
  redirect("/admin/media?deleted=1");
}
