export const instant = false;
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StaffDirectory() {
  const staff = await requireStaff(["SUPER_ADMIN"]); const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase.from("staff_profiles").select("id, auth_user_id, display_name, is_active, staff_memberships!staff_memberships_profile_id_fkey(staff_roles(code))").order("display_name");
  const admin = createSupabaseAdminClient(); const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }); const emails = new Map((authData?.users ?? []).map((user) => [user.id, user.email ?? "Email unavailable"]));
  return <AdminShell title="Staff" staff={staff} breadcrumbs={[{ label: "Staff" }]}>{profiles?.length ? <div className="overflow-x-auto border bg-white"><table className="w-full min-w-180 text-left"><thead className="border-b bg-background-warm text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-4">Staff member</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y">{profiles.map((profile) => { const memberships = profile.staff_memberships as unknown as { staff_roles: { code: string } | { code: string }[] | null }[]; const roles = memberships.flatMap((membership) => Array.isArray(membership.staff_roles) ? membership.staff_roles.map((role) => role.code) : membership.staff_roles ? [membership.staff_roles.code] : []); return <tr key={profile.id}><td className="px-5 py-4 font-bold">{profile.display_name}</td><td className="px-5 py-4 text-sm">{emails.get(profile.auth_user_id) ?? "Email unavailable"}</td><td className="px-5 py-4 text-sm font-semibold">{roles.join(", ") || "No role"}</td><td className="px-5 py-4"><span className={`border px-2 py-1 text-xs font-bold uppercase ${profile.is_active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-zinc-300 bg-zinc-100 text-zinc-600"}`}>{profile.is_active ? "Active" : "Inactive"}</span></td></tr>; })}</tbody></table></div> : <AdminEmptyState title="No staff profiles" description="Provisioned staff accounts will appear here. Public registration remains disabled." />}</AdminShell>;
}
