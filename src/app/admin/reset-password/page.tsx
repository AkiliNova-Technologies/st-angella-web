import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { requireStaff } from "@/lib/auth/require-staff";
export const instant = false;
export default async function ResetPasswordPage() { await requireStaff(); return <main className="mx-auto flex min-h-dvh max-w-lg items-center px-5 py-16"><div className="w-full bg-white p-8"><h1 className="font-heading text-3xl font-bold text-brand-900">Choose a new password</h1><p className="mt-3 text-sm text-muted-foreground">Use a unique password of at least 12 characters.</p><ResetPasswordForm /></div></main>; }
