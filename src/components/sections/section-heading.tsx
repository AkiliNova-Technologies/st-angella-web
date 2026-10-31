import { cn } from "@/lib/utils";
export function SectionHeading({ eyebrow, title, description, align = "left", className }: { eyebrow?: string; title: string; description?: string; align?: "left" | "center"; className?: string }) {
  return <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>{eyebrow && <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-800 before:h-0.5 before:w-8 before:bg-accent-gold">{eyebrow}</p>}<h2 className="font-heading text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl lg:text-5xl">{title}</h2>{description && <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">{description}</p>}</div>;
}
