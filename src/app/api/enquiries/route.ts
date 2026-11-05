import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { admissionsEnquirySchema, contactEnquirySchema } from "@/lib/enquiry-schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return NextResponse.json({ error: "Invalid content type." }, { status: 415 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 10000) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const wrapper = z.object({ variant: z.enum(["admissions", "contact"]), website: z.string().max(200).optional(), values: z.unknown() }).safeParse(input);
  if (!wrapper.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (wrapper.data.website) return NextResponse.json({ success: true }, { status: 200 });
  const parsed = (wrapper.data.variant === "admissions" ? admissionsEnquirySchema : contactEnquirySchema).safeParse(wrapper.data.values);
  if (!parsed.success) return NextResponse.json({ error: "Please check the enquiry details." }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Enquiry service unavailable." }, { status: 503 });
  const fingerprint = createHmac("sha256", secret).update(ip).digest("hex");
  const values = parsed.data;
  const { error } = await createSupabaseAdminClient().rpc("submit_school_enquiry", {
    p_type: wrapper.data.variant,
    p_name: values.name,
    p_email: values.email,
    p_phone: values.phone,
    p_message: values.message,
    p_intended_class: "intendedClass" in values ? values.intendedClass : null,
    p_fingerprint: fingerprint,
  });
  if (error) {
    if (error.message.includes("Too many enquiries")) return NextResponse.json({ error: "Too many enquiries. Please try again later." }, { status: 429 });
    console.error("Public enquiry submission failed", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Unable to send your enquiry. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
