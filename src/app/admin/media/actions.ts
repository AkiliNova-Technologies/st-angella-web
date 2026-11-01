"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

/** Upload an image from a content editor without redirecting or publishing it. */
export async function uploadEditorImageAction(formData: FormData): Promise<{id?:string;object_path?:string;alt_text?:string|null;is_approved?:boolean;error?:string}> {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "media:manage") || !staff.roles.some(role => role === "EDITOR" || role === "SUPER_ADMIN")) return {error:"Not authorized to upload images."};
  const file = formData.get("file");
  const alt = z.string().trim().min(1).max(500).safeParse(formData.get("alt_text"));
  const pupils = z.enum(["yes","no"]).safeParse(formData.get("contains_pupils"));
  if (!(file instanceof File) || !["image/jpeg","image/png","image/webp"].includes(file.type) || file.size < 1 || file.size > MAX_UPLOAD || !alt.success || !pupils.success) return {error:"Choose a JPEG, PNG or WebP image under 8 MB and provide alternative text and pupil consent classification."};
  const bucket = process.env.MEDIA_PRIVATE_BUCKET || "school-photography";
  if (!["school-photography","news-images","gallery-images","brand-assets"].includes(bucket)) return {error:"Private media storage is not configured."};
  const supabase = await createSupabaseServerClient();
  const path = staff.userId + "/" + crypto.randomUUID() + "." + ALLOWED.get(file.type);
  const {error: uploadError} = await supabase.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
  if (uploadError) return {error:"Unable to upload image."};
  const {data,error} = await supabase.from("media_assets").insert({bucket,object_path:path,kind:"IMAGE",mime_type:file.type,byte_size:file.size,alt_text:alt.data,uploaded_by_id:staff.profileId,contains_pupils:pupils.data==="yes",is_approved:false,is_public:false}).select("id,object_path,alt_text,is_approved").single();
  if (error || !data) { await supabase.storage.from(bucket).remove([path]); return {error:"Unable to register uploaded image."}; }
  revalidatePath("/admin/media");
  return data;
}

export async function reviewMediaAction(formData: FormData) {
 const staff=await requireStaff(["REVIEWER","SUPER_ADMIN"]);
 if (!hasPermission(staff.roles,"media:manage")) redirect("/admin/forbidden");
 const parsed=z.object({id:z.string().uuid(),action:z.enum(["APPROVE","PUBLISH","WITHDRAW"])}).safeParse(Object.fromEntries(formData));
 if (!parsed.success) redirect("/admin/media?error=validation");
 const supabase=await createSupabaseServerClient();
 const {error}=await supabase.rpc("review_media_publication",{p_asset_id:parsed.data.id,p_action:parsed.data.action});
 if(error) { console.error("Media review failed",{code:error.code}); redirect("/admin/media?error=review"); }
 revalidatePath("/admin/media"); revalidatePath("/gallery"); revalidatePath("/news"); revalidatePath("/");
 redirect("/admin/media?reviewed=1");
}

export async function deleteUnusedMediaAction(formData: FormData) {
 const staff = await requireStaff();
 if (!staff.roles.some(role => role === "EDITOR" || role === "SUPER_ADMIN")) redirect("/admin/forbidden");
 const id = z.string().uuid().safeParse(formData.get("id"));
 if (!id.success) redirect("/admin/media?error=validation");
 const supabase = await createSupabaseServerClient();
 const { data, error } = await supabase.rpc("delete_unused_private_media", { p_asset_id: id.data });
 if (error || !Array.isArray(data) || data.length !== 1) {
   console.error("Private media deletion rejected", { code: error?.code });
   redirect("/admin/media?error=inuse");
 }
 const asset = data[0] as { bucket: string; object_path: string };
 const removed = await supabase.storage.from(asset.bucket).remove([asset.object_path]);
 if (removed.error) {
   console.error("Media database deleted but storage cleanup failed", { assetId: id.data, code: removed.error.name });
   redirect("/admin/media?error=storage_cleanup");
 }
 revalidatePath("/admin/media");
 revalidatePath("/admin/gallery");
 redirect("/admin/media?deleted=1");
}

const consentSchema = z.object({
 id:z.string().uuid(),
 status:z.enum(["GRANTED","REVOKED"]),
 reference_code:z.string().trim().max(120),
 valid_from:z.union([z.literal(""),z.iso.date()]),
 valid_until:z.union([z.literal(""),z.iso.date()]),
 notes:z.string().trim().max(1000),
}).superRefine((value,ctx)=>{
 if(value.status==="GRANTED" && !value.reference_code) ctx.addIssue({code:"custom",path:["reference_code"],message:"Consent evidence reference is required"});
 if(value.valid_from && value.valid_until && value.valid_from>value.valid_until) ctx.addIssue({code:"custom",path:["valid_until"],message:"Expiry precedes start"});
});
export async function recordMediaConsentAction(formData:FormData) {
 const staff=await requireStaff(["REVIEWER","SUPER_ADMIN"]);
 if(!hasPermission(staff.roles,"media:manage")) redirect("/admin/forbidden");
 const parsed=consentSchema.safeParse(Object.fromEntries(formData));
 if(!parsed.success) redirect("/admin/media?error=consent_validation");
 const input=parsed.data;
 const supabase=await createSupabaseServerClient();
 const {data:asset,error:assetError}=await supabase.from("media_assets").select("id,kind,contains_pupils").eq("id",input.id).single();
 if(assetError || !asset || asset.kind!=="IMAGE" || !asset.contains_pupils) redirect("/admin/media?error=consent_asset");
 const {error}=await supabase.from("media_consent_records").insert({
  media_asset_id:input.id,status:input.status,reference_code:input.reference_code||null,
  valid_from:input.valid_from||null,valid_until:input.valid_until||null,
  notes:input.notes||null,recorded_by_id:staff.profileId
 });
 if(error){console.error("Consent recording rejected",{code:error.code});redirect("/admin/media?error=consent_save");}
 revalidatePath("/admin/media");revalidatePath("/admin/gallery");revalidatePath("/gallery");revalidatePath("/news");revalidatePath("/");
 redirect("/admin/media?consent_saved=1");
}
