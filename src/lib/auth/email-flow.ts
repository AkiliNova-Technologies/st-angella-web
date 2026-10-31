export const emailFlowDestinations = {
  invite: "/admin/set-password",
  recovery: "/admin/reset-password",
} as const;

export type SupportedEmailFlow = keyof typeof emailFlowDestinations;

export function isSupportedEmailFlow(value: string | null): value is SupportedEmailFlow {
  return value === "invite" || value === "recovery";
}

export function destinationForEmailFlow(type: SupportedEmailFlow, requested: string | null) {
  const expected = emailFlowDestinations[type];
  return requested === expected ? requested : expected;
}

export function buildEmailConfirmationUrl(siteUrl: string, next: string) {
  const url = new URL("/auth/confirm", siteUrl);
  url.searchParams.set("next", next);
  return url.toString();
}
