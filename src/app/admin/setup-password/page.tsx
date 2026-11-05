"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SetupPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "saving" | "invalid" | "complete">("checking");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [client] = useState(() => createSupabaseBrowserClient());

  useEffect(() => {
    let active = true;
    async function initialize() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      const authError = hash.get("error_description") || query.get("error_description");
      if (authError) { if (active) { setError(authError); setStatus("invalid"); } return; }
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const tokenHash = query.get("token_hash");
      const type = query.get("type");
      // Remove credentials from the address bar immediately.
      if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
      let failure: string | undefined;
      if (accessToken && refreshToken && hash.get("type") === "invite") {
        const result = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        failure = result.error?.message;
      } else if (tokenHash && type === "invite") {
        const result = await client.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
        failure = result.error?.message;
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        // Supabase may have already exchanged the invite code into a browser session.
        const result = await client.auth.getUser();
        if (result.error || !result.data.user) failure = "This invitation is invalid or expired. Request a new invitation from your administrator.";
      }
      if (!active) return;
      if (failure) { setError(failure); setStatus("invalid"); } else setStatus("ready");
    }
    void initialize();
    return () => { active = false; };
  }, [client]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== "ready") return;
    if (password.length < 12) { setError("Use at least 12 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError(""); setStatus("saving");
    const result = await client.auth.updateUser({ password });
    if (result.error) { setError(result.error.message); setStatus("ready"); return; }
    await client.auth.signOut();
    setStatus("complete");
    router.replace("/admin/login?setup=complete");
    router.refresh();
  }

  return <main className="mx-auto flex min-h-dvh max-w-lg items-center px-5 py-16"><section className="w-full border-t-4 border-accent-gold bg-white p-8"><p className="text-xs font-bold uppercase tracking-widest text-brand-800">St. Angella staff access</p><h1 className="mt-4 font-heading text-3xl font-bold text-brand-900">Set your password</h1><p className="mt-3 text-sm text-muted-foreground">Complete your staff invitation to access the administration dashboard.</p>
    {status === "checking" && <p role="status" className="mt-6">Verifying your invitation…</p>}
    {error && <p role="alert" className="mt-6 border-l-4 border-destructive bg-red-50 p-4 text-sm">{error}</p>}
    {status === "invalid" && <a className="mt-5 inline-block font-semibold text-brand-800 underline" href="/admin/login">Return to staff login</a>}
    {(status === "ready" || status === "saving") && <form onSubmit={save} className="mt-7 space-y-5"><div><label htmlFor="new-password" className="text-sm font-semibold">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} className="mt-2 min-h-12 w-full border px-3" /></div><div><label htmlFor="confirm-password" className="text-sm font-semibold">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-2 min-h-12 w-full border px-3" /></div><button type="submit" disabled={status === "saving"} className="min-h-12 w-full bg-brand-800 px-5 font-bold text-white disabled:opacity-60">{status === "saving" ? "Setting password…" : "Set password"}</button></form>}
    {status === "complete" && <p role="status" className="mt-6">Password saved. Redirecting to staff login…</p>}
  </section></main>;
}
