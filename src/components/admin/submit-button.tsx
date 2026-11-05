"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
export function SubmitButton({ children, className = "bg-brand-800 px-5 py-3 text-sm font-bold text-white", disabled = false }: { children: React.ReactNode; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} className={className + " inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60"}>{pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{pending ? "Please wait…" : children}</button>;
}
