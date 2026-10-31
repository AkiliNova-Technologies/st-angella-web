import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "gold"; showArrow?: boolean };
export function LinkButton({ className, variant = "primary", showArrow = false, children, ...props }: LinkButtonProps) {
  return <Link className={cn("inline-flex min-h-11 items-center justify-center gap-2 border px-5 text-sm font-bold transition-colors", variant === "primary" && "border-brand-800 bg-brand-800 text-white hover:bg-brand-900", variant === "secondary" && "border-brand-800 bg-transparent text-brand-800 hover:bg-background-soft", variant === "gold" && "border-accent-gold bg-accent-gold text-brand-900 hover:bg-[#b9983e]", className)} {...props}>{children}{showArrow && <ArrowRight className="size-4" aria-hidden="true" />}</Link>;
}
