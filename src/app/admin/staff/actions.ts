"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { publicEnv } from "@/lib/env";
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
  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, { data: { display_name: parsed.data.displayName }, redirectTo: new URL("/admin/setup-password", publicEnv().NEXT_PUBLIC_SITE_URL).toString() });
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

const manageSchema = z.object({ profileId: z.string().uuid(), operation: z.enum(["suspend", "reactivate", "remove", "role"]), role: z.enum(["EDITOR", "REVIEWER"]).optional() });
export async function manageStaffAction(formData: FormData) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  const parsed = manageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/staff?error=invalid");
  const { profileId, operation, role } = parsed.data;
  if (profileId === staff.profileId) redirect("/admin/staff?error=self");
  const admin = createSupabaseAdminClient();
  const { data: target, error: targetError } = await admin.from("staff_profiles").select("id,auth_user_id,is_active").eq("id", profileId).single();
  if (targetError || !target) redirect("/admin/staff?error=notfound");
  const { data: memberships, error: membershipsError } = await admin.from("staff_memberships").select("role_id,staff_roles(code)").eq("profile_id", profileId);
  if (membershipsError || !memberships) redirect("/admin/staff?error=membership");
  const isSuperAdmin = memberships.some((membership) => {
    const roles = membership.staff_roles as unknown as { code: string } | { code: string }[] | null;
    return Array.isArray(roles) ? roles.some((item) => item.code === "SUPER_ADMIN") : roles?.code === "SUPER_ADMIN";
  });
  // Super-admin changes require a separate protected ownership-transfer workflow.
  if (isSuperAdmin) redirect("/admin/staff?error=protected");
  if (operation === "role") {
    if (!role || !target.is_active) redirect("/admin/staff?error=invalid");
    const { data: desired, error: roleError } = await admin.from("staff_roles").select("id").eq("code", role).single();
    if (roleError || !desired) redirect("/admin/staff?error=role");
    const { error: grantError } = await admin.from("staff_memberships").upsert({ profile_id: profileId, role_id: desired.id, granted_by: staff.profileId }, { onConflict: "profile_id,role_id" });
    if (grantError) redirect("/admin/staff?error=membership");
    const obsolete = memberships.map((item) => item.role_id).filter((id) => id !== desired.id);
    if (obsolete.length) {
      const { error: revokeError } = await admin.from("staff_memberships").delete().eq("profile_id", profileId).in("role_id", obsolete);
      if (revokeError) redirect("/admin/staff?error=membership");
    }
  } else {
    const { error: statusError } = await admin.from("staff_profiles").update({ is_active: operation === "reactivate" }).eq("id", profileId);
    if (statusError) redirect("/admin/staff?error=status");
    if (operation === "remove") {
      const { error: revokeError } = await admin.from("staff_memberships").delete().eq("profile_id", profileId);
      if (revokeError) redirect("/admin/staff?error=membership");
    }
  }
  revalidatePath("/admin/staff");
  redirect("/admin/staff?updated=1");
}
