import type { StaffRole } from "@/lib/auth/permissions";
export const contentStatuses = ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"] as const;
export type ContentStatus = (typeof contentStatuses)[number];
const transitions: Record<ContentStatus, readonly ContentStatus[]> = { DRAFT: ["IN_REVIEW"], IN_REVIEW: ["DRAFT", "APPROVED"], APPROVED: ["DRAFT", "PUBLISHED"], PUBLISHED: ["ARCHIVED"], ARCHIVED: ["DRAFT"] };
export function canTransitionContent(input: { from: ContentStatus; to: ContentStatus; roles: readonly StaffRole[]; authorProfileId: string; actorProfileId: string; latestRevisionApproved: boolean }) {
  if (!transitions[input.from].includes(input.to)) return false;
  const isSuperAdmin = input.roles.includes("SUPER_ADMIN");
  if (input.to === "IN_REVIEW") return (input.roles.includes("EDITOR") || isSuperAdmin) && input.authorProfileId === input.actorProfileId;
  if (input.to === "APPROVED" || input.to === "PUBLISHED") return (input.roles.includes("REVIEWER") || isSuperAdmin) && input.authorProfileId !== input.actorProfileId && input.latestRevisionApproved;
  if (input.from === "ARCHIVED" && input.to === "DRAFT") return isSuperAdmin;
  return isSuperAdmin || input.authorProfileId === input.actorProfileId || input.roles.includes("REVIEWER");
}
