import { AdminPlaceholder } from "@/components/admin/admin-placeholder"; import { requireStaff } from "@/lib/auth/require-staff";
export default async function MediaAdmin() { const staff = await requireStaff(); return <AdminPlaceholder title="Media Library" staff={staff} description="Secure uploads and consent-aware media publishing will be enabled in a later milestone." />; }
