"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { buildEmailConfirmationUrl } from "@/lib/auth/email-flow";
const credentials = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
export async function loginAction(formData: FormData) { const parsed = credentials.safeParse(Object.fromEntries(formData)); if (!parsed.success) redirect("/admin/login?error=invalid"); const supabase = await createSupabaseServerClient(); const { error } = await supabase.auth.signInWithPassword(parsed.data); if (error) redirect("/admin/login?error=credentials"); redirect("/admin"); }
export async function logoutAction() { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut({ scope: "local" }); redirect("/admin/login"); }
export async function requestRecoveryAction(formData: FormData) { const email = z.string().email().safeParse(formData.get("email")); if (email.success) { const supabase = await createSupabaseServerClient(); await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: buildEmailConfirmationUrl(publicEnv().NEXT_PUBLIC_SITE_URL, "/admin/reset-password") }); } redirect("/admin/forgot-password?sent=1"); }
