"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveSettingAction(formData: FormData) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  const id = z.string().uuid().optional().safeParse(formData.get("id") || undefined);
  const key = z.string().regex(/^[a-z][a-z0-9_]{1,119}$/).safeParse(formData.get("key"));
  const raw = z.string().min(1).max(20000).safeParse(formData.get("value"));
  if (!id.success || !raw.success) redirect("/admin/settings?error=1");
  let value: unknown;
  try { value = JSON.parse(raw.data); } catch { redirect("/admin/settings?error=1"); }
  if (value === null) redirect("/admin/settings?error=1");
  const supabase = await createSupabaseServerClient();
  const payload = { value, is_public: formData.get("is_public") === "on", updated_by: staff.profileId };
  const result = id.data ? await supabase.from("school_settings").update(payload).eq("id", id.data).select("id").single() : key.success ? await supabase.from("school_settings").insert({ ...payload, key: key.data }).select("id").single() : null;
  if (!result || result.error || !result.data) redirect("/admin/settings?error=1");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
