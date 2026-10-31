export function isMediaPublicationEligible(input: {
  approved: boolean;
  altText?: string | null;
  containsPupils: boolean;
  consentGranted: boolean;
  consentValidFrom?: Date | null;
  consentValidUntil?: Date | null;
  now?: Date;
}) {
  if (!input.approved || !input.altText?.trim()) return false;
  if (!input.containsPupils) return true;
  if (!input.consentGranted) return false;
  const now = input.now ?? new Date();
  if (input.consentValidFrom && input.consentValidFrom > now) return false;
  if (input.consentValidUntil && input.consentValidUntil < now) return false;
  return true;
}
