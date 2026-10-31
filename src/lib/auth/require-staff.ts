import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StaffRole } from "./permissions";

type StaffContext = { userId: string; profileId: string; displayName: string; roles: StaffRole[] };
export async function getStaffContext(): Promise<StaffContext | null> {
  await connection();
  const supabase = await createSupabaseServerClient(); const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub; if (claimsError || !userId) return null;
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, display_name, is_active, staff_memberships!staff_memberships_profile_id_fkey(staff_roles(code))")
    .eq("auth_user_id", userId)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  const roles = (data.staff_memberships ?? []).flatMap((membership: { staff_roles: { code: StaffRole } | { code: StaffRole }[] | null }) => Array.isArray(membership.staff_roles) ? membership.staff_roles.map((role) => role.code) : membership.staff_roles ? [membership.staff_roles.code] : []);
  if (roles.length === 0) return null;
  return { userId, profileId: data.id, displayName: data.display_name, roles };
}
export async function requireStaff(allowedRoles?: readonly StaffRole[]) {
  const staff = await getStaffContext();
  if (!staff) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    if (!error && data?.claims?.sub) redirect("/admin/forbidden");
    redirect("/admin/login");
  }
  if (allowedRoles && !staff.roles.some((role) => allowedRoles.includes(role))) redirect("/admin/forbidden");
  return staff;
}
