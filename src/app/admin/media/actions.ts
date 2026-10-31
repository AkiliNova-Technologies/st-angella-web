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
