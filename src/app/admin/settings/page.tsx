import { AdminPlaceholder } from "@/components/admin/admin-placeholder"; import { requireStaff } from "@/lib/auth/require-staff";
export default async function SettingsAdmin() { const staff = await requireStaff(["SUPER_ADMIN"]); return <AdminPlaceholder title="Settings" staff={staff} description="School configuration controls will be introduced after the content workflows are qualified." />; }
