import { AdminPlaceholder } from "@/components/admin/admin-placeholder"; import { requireStaff } from "@/lib/auth/require-staff";
export default async function EnquiriesAdmin() { const staff = await requireStaff(["SUPER_ADMIN"]); return <AdminPlaceholder title="Enquiries" staff={staff} description="Enquiry administration remains disabled while public submission delivery is inactive." />; }
