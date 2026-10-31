"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ displayName: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254), role: z.enum(["EDITOR", "REVIEWER"]) });
export async function inviteStaffAction(formData: FormData) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/staff?error=invalid");
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("staff_profiles").select("id").limit(1).eq("auth_user_id", staff.userId);
  if (!existing?.length) redirect("/admin/staff?error=unauthorized");
  const { data: role, error: roleError } = await admin.from("staff_roles").select("id").eq("code", parsed.data.role).single();
  if (roleError || !role) redirect("/admin/staff?error=role");
  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, { data: { display_name: parsed.data.displayName } });
  if (inviteError || !invitation.user) {
    console.error("Staff invitation failed", { code: inviteError?.code, message: inviteError?.message });
    redirect("/admin/staff?error=invite");
  }
  const authUserId = invitation.user.id;
  const { data: profile, error: profileError } = await admin.from("staff_profiles").upsert({ auth_user_id: authUserId, display_name: parsed.data.displayName, is_active: true }, { onConflict: "auth_user_id" }).select("id").single();
  if (profileError || !profile) {
    console.error("Staff profile provisioning failed", { code: profileError?.code, message: profileError?.message });
    redirect("/admin/staff?error=profile");
  }
  const { error: membershipError } = await admin.from("staff_memberships").upsert({ profile_id: profile.id, role_id: role.id, granted_by: staff.profileId }, { onConflict: "profile_id,role_id" });
  if (membershipError) {
    console.error("Staff role provisioning failed", { code: membershipError.code, message: membershipError.message });
    redirect("/admin/staff?error=membership");
  }
  revalidatePath("/admin/staff");
  redirect("/admin/staff?invited=1");
}
