"use client";

import { useState, type FormEvent } from "react";
import type { ZodError } from "zod";
import { admissionsEnquirySchema, contactEnquirySchema } from "@/lib/enquiry-schemas";

type FieldErrors = Record<string, string | undefined>;
function errorsFrom(error: ZodError): FieldErrors { const fields: FieldErrors = {}; for (const issue of error.issues) { const key = String(issue.path[0] ?? "form"); fields[key] ??= issue.message; } return fields; }
const fieldClass = "mt-2 min-h-12 w-full border border-input bg-white px-3 py-2 text-base outline-none placeholder:text-muted-foreground/70 focus:border-brand-800 focus:ring-2 focus:ring-brand-800/20 disabled:bg-background-soft";

export function EnquiryForm({ variant }: { variant: "admissions" | "contact" }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  async function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (sending) return; setReady(false); setServerError("");
    const data = new FormData(event.currentTarget);
    const values = { name: data.get("name"), email: data.get("email"), phone: data.get("phone"), ...(variant === "admissions" ? { intendedClass: data.get("intendedClass") } : {}), message: data.get("message"), privacy: data.get("privacy") === "on" };
    const result = (variant === "admissions" ? admissionsEnquirySchema : contactEnquirySchema).safeParse(values);
    if (!result.success) { setErrors(errorsFrom(result.error)); return; }
    setErrors({}); setSending(true);
    try {
      const response = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variant, values, website: data.get("website") || "" }) });
      if (!response.ok) { const result = await response.json(); setServerError(result.error || "Unable to send your enquiry."); return; }
      setReady(true); event.currentTarget?.reset?.();
    } catch { setServerError("Unable to send your enquiry. Please try again."); }
    finally { setSending(false); }
  }
  const error = (field: string) => errors[field] ? <p id={`${field}-error`} className="mt-1 text-sm font-medium text-destructive">{errors[field]}</p> : null;
  return <form noValidate onSubmit={validate} className="border border-border bg-white p-6 sm:p-8" aria-describedby="form-status"><div className="grid gap-6 sm:grid-cols-2">
    <div><label htmlFor={`${variant}-name`} className="font-semibold text-brand-900">Parent or guardian name</label><input id={`${variant}-name`} name="name" autoComplete="name" className={fieldClass} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} required />{error("name")}</div>
    <div><label htmlFor={`${variant}-email`} className="font-semibold text-brand-900">Email address</label><input id={`${variant}-email`} name="email" type="email" autoComplete="email" className={fieldClass} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} required />{error("email")}</div>
    <div><label htmlFor={`${variant}-phone`} className="font-semibold text-brand-900">Phone number</label><input id={`${variant}-phone`} name="phone" type="tel" autoComplete="tel" className={fieldClass} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} required />{error("phone")}</div>
    {variant === "admissions" && <div><label htmlFor="intended-class" className="font-semibold text-brand-900">Child&apos;s intended class</label><select id="intended-class" name="intendedClass" className={fieldClass} defaultValue="" aria-invalid={!!errors.intendedClass} aria-describedby={errors.intendedClass ? "intendedClass-error" : undefined} required><option value="" disabled>Select a class</option>{["Nursery", "P1", "P2", "P3", "P4", "P5", "P6", "P7"].map((value) => <option key={value}>{value}</option>)}</select>{error("intendedClass")}</div>}
  </div><div className="mt-6"><label htmlFor={`${variant}-message`} className="font-semibold text-brand-900">Enquiry message</label><textarea id={`${variant}-message`} name="message" rows={6} className={fieldClass} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : "message-help"} required /><p id="message-help" className="mt-1 text-xs text-muted-foreground">Please do not include medical records, identification numbers, or other sensitive information.</p>{error("message")}</div>
  <div className="hidden" aria-hidden="true"><label htmlFor={`${variant}-website`}>Leave this field blank</label><input id={`${variant}-website`} name="website" tabIndex={-1} autoComplete="off" /></div>
  <div className="mt-6"><label className="flex items-start gap-3"><input type="checkbox" name="privacy" className="mt-1 size-5 shrink-0 accent-[#174d38]" aria-invalid={!!errors.privacy} aria-describedby={errors.privacy ? "privacy-error" : undefined} /><span className="text-sm text-muted-foreground">I agree to the school storing my enquiry and contact details for the purpose of responding, subject to its privacy and retention policy.</span></label>{error("privacy")}</div>
  <div id="form-status" aria-live="polite" className="mt-6 border-l-4 border-accent-gold bg-background-warm p-4 text-sm text-brand-900">{ready ? <strong>Your enquiry has been sent successfully. The school team can now review it.</strong> : serverError || "Your information will be securely submitted to the school administration."}</div>
  <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="submit" disabled={sending} className="min-h-11 border border-brand-800 bg-brand-800 px-5 text-sm font-bold text-white hover:bg-brand-900 disabled:opacity-60">{sending ? "Sending…" : "Send enquiry"}</button></div>
  </form>;
}
