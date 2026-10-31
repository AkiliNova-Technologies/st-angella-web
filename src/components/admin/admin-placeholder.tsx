import { AdminShell } from "./admin-shell";
import { AdminEmptyState } from "./empty-state";
import type { StaffRole } from "@/lib/auth/permissions";
export function AdminPlaceholder({ title, description, staff }: { title: string; description: string; staff: { displayName: string; roles: StaffRole[] } }) { return <AdminShell title={title} staff={staff} breadcrumbs={[{ label: title }]}><AdminEmptyState title={`${title} workspace is not enabled yet`} description={description} /></AdminShell>; }
