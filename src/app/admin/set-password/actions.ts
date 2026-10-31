"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const passwordSchema = z
  .object({
    password: z.string().min(12).max(128),
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation);

export async function setInvitedPasswordAction(formData: FormData) {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/admin/set-password?error=password");

  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/admin/set-password?error=invalid");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) redirect("/admin/set-password?error=update");

  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login?setup=complete");
}
