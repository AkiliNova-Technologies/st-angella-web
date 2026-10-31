import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
export function SchoolIdentity({ inverse = false }: { inverse?: boolean }) {
  return <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="St. Angella School home">
    <Image src="/brand/st-angella-crest.png" alt="St. Angella Nursery and Primary School crest" width={72} height={72} className="h-12 w-12 shrink-0 object-contain min-[420px]:h-14 min-[420px]:w-14 sm:h-16 sm:w-16" priority />
    <span className="min-w-0 leading-none"><strong className={cn("block whitespace-nowrap font-heading text-sm font-extrabold tracking-[0.04em] min-[420px]:text-base sm:text-lg", inverse ? "text-white" : "text-brand-900")}>ST. ANGELLA</strong><span className={cn("mt-1 hidden text-[0.62rem] font-semibold tracking-[0.12em] min-[420px]:block sm:text-[0.68rem]", inverse ? "text-white/80" : "text-brand-800")}>NURSERY &amp; PRIMARY SCHOOL</span><span className="mt-1.5 hidden text-xs font-semibold text-accent-gold min-[420px]:block">Never Give Up</span></span>
  </Link>;
}
