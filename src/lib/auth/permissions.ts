export const staffRoles = ["SUPER_ADMIN", "EDITOR", "REVIEWER"] as const;
export type StaffRole = (typeof staffRoles)[number];
export type Permission = "staff:manage" | "settings:manage" | "enquiries:read" | "content:edit" | "content:review" | "content:publish" | "media:manage";
const permissions: Record<StaffRole, readonly Permission[]> = {
  SUPER_ADMIN: ["staff:manage", "settings:manage", "enquiries:read", "content:edit", "content:review", "content:publish", "media:manage"],
  EDITOR: ["content:edit", "media:manage"],
  REVIEWER: ["content:review", "content:publish", "media:manage"],
};
export function hasPermission(roles: readonly StaffRole[], permission: Permission) { return roles.some((role) => permissions[role].includes(permission)); }
export function canReviewOwnContent(authorProfileId: string, reviewerProfileId: string) { return authorProfileId !== reviewerProfileId; }
