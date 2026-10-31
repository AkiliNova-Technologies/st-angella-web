import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";

export function ContentSection({ eyebrow, title, description, tone = "white", children, id }: { eyebrow?: string; title: string; description?: string; tone?: "white" | "warm" | "soft" | "dark"; children?: ReactNode; id?: string }) {
  return <section id={id} className={cn("py-16 lg:py-24", tone === "warm" && "bg-background-warm", tone === "soft" && "bg-background-soft", tone === "dark" && "bg-brand-900 text-white")}><Container><SectionHeading eyebrow={eyebrow} title={title} description={description} className={cn(tone === "dark" && "[&_h2]:text-white [&_p]:text-white/70")} />{children && <div className="mt-10">{children}</div>}</Container></section>;
}
