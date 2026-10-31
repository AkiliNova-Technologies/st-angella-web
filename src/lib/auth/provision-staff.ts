import "server-only";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "./require-staff";
import { staffRoles } from "./permissions";
import { buildEmailConfirmationUrl } from "./email-flow";
import { publicEnv } from "@/lib/env";

const inputSchema = z.object({ email: z.string().email(), displayName: z.string().trim().min(2).max(120), role: z.enum(staffRoles) });
export async function provisionStaffAccount(input: z.infer<typeof inputSchema>) {
  const actor = await requireStaff(["SUPER_ADMIN"]); const values = inputSchema.parse(input); const admin = createSupabaseAdminClient();
  const redirectTo = buildEmailConfirmationUrl(publicEnv().NEXT_PUBLIC_SITE_URL, "/admin/set-password");
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(values.email, {
    data: { display_name: values.displayName },
    redirectTo,
  });
  if (inviteError || !invited.user) throw new Error("Staff invitation could not be created.");
  const supabase = await createSupabaseServerClient();
  const { data: role, error: roleError } = await supabase.from("staff_roles").select("id").eq("code", values.role).single();
  if (roleError || !role) throw new Error("Staff role is unavailable.");
  const { data: profile, error: profileError } = await supabase.from("staff_profiles").insert({ auth_user_id: invited.user.id, display_name: values.displayName }).select("id").single();
  if (profileError || !profile) { await admin.auth.admin.deleteUser(invited.user.id); throw new Error("Staff profile could not be created."); }
  const { error: membershipError } = await supabase.from("staff_memberships").insert({ profile_id: profile.id, role_id: role.id, granted_by: actor.profileId });
  if (membershipError) { await admin.auth.admin.deleteUser(invited.user.id); throw new Error("Staff membership could not be created."); }
  return { profileId: profile.id };
}
