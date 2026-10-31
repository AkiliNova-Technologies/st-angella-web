"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateEnquiryStatusAction(formData: FormData) {
  await requireStaff(["SUPER_ADMIN"]);
  const parsed = z.object({ id: z.string().uuid(), type: z.enum(["admissions", "contact"]), status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/enquiries?error=1");
  const { id, type, status } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const table = type === "contact" ? "contact_enquiries" : "admission_enquiries";
  const { data, error } = await supabase.from(table).update({ status }).eq("id", id).is("deleted_at", null).select("id").single();
  if (error || !data) redirect(`/admin/enquiries?type=${type}&error=1`);
  revalidatePath("/admin/enquiries");
  redirect(`/admin/enquiries?type=${type}&saved=1`);
}
