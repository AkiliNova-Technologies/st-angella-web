import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  destinationForEmailFlow,
  isSupportedEmailFlow,
} from "@/lib/auth/email-flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectWithoutToken(request: NextRequest, pathname: string) {
  const response = NextResponse.redirect(new URL(pathname, request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || !isSupportedEmailFlow(type)) {
    return redirectWithoutToken(request, "/admin/set-password?error=invalid");
  }

  const destination = destinationForEmailFlow(
    type,
    request.nextUrl.searchParams.get("next"),
  );
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error || !data.session) {
    const errorDestination =
      type === "invite"
        ? "/admin/set-password?error=invalid"
        : "/admin/login?error=recovery";
    return redirectWithoutToken(request, errorDestination);
  }

  return redirectWithoutToken(request, destination);
}
