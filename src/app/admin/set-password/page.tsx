import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setInvitedPasswordAction } from "./actions";

export const instant = false;
export const metadata = { title: "Set up staff password" };

const errorMessages = {
  invalid:
    "This invitation is invalid, expired, or has already been used. Ask an administrator for a new invitation.",
  password: "Use matching passwords of at least 12 characters.",
  update: "The password could not be updated. Ask an administrator for a new invitation.",
} as const;

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const hasVerifiedSession = !claimsError && Boolean(data?.claims?.sub);
  const message =
    error && error in errorMessages
      ? errorMessages[error as keyof typeof errorMessages]
      : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center px-5 py-16">
      <div className="w-full border-t-4 border-accent-gold bg-white p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-800">
          Staff invitation
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold text-brand-900">
          Set up your password
        </h1>
        {message && (
          <p
            role="alert"
            className="mt-5 border-l-4 border-destructive bg-background-warm p-4 text-sm"
          >
            {message}
          </p>
        )}
        {!hasVerifiedSession ? (
          <div className="mt-6">
            {!message && (
              <p role="alert" className="text-sm text-muted-foreground">
                Open the secure link in your invitation email to continue.
              </p>
            )}
            <a
              href="/admin/login"
              className="mt-5 inline-block text-sm font-semibold text-brand-800 underline"
            >
              Return to staff sign in
            </a>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Choose a unique password of at least 12 characters. Invitation
              links can only be used once.
            </p>
            <form action={setInvitedPasswordAction} className="mt-7 space-y-5">
              <div>
                <label htmlFor="password" className="font-semibold">
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  className="mt-2 min-h-12 w-full border px-3"
                />
              </div>
              <div>
                <label htmlFor="confirmation" className="font-semibold">
                  Confirm password
                </label>
                <input
                  id="confirmation"
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                  className="mt-2 min-h-12 w-full border px-3"
                />
              </div>
              <button className="min-h-11 w-full bg-brand-800 px-5 text-sm font-bold text-white">
                Set password
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
