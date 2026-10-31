import { ImageIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/ui/link-button";

export function Hero() {
  return <section className="relative overflow-hidden bg-background-soft" aria-labelledby="home-hero-title">
    <div className="relative min-h-[44rem] lg:min-h-[42rem] xl:min-h-[46rem]">
      <div className="absolute inset-x-0 bottom-0 top-[32rem] flex items-center justify-center border-y border-brand-800/15 bg-background-warm lg:inset-y-0 lg:left-[38%] lg:right-0 lg:border-y-0 lg:border-l">
        <div className="max-w-xs px-6 text-center text-brand-800"><ImageIcon className="mx-auto size-10" strokeWidth={1.5} aria-hidden="true" /><p className="mt-4 text-sm font-semibold">Approved hero photography pending</p><p className="mt-1 text-xs text-muted-foreground">No generated or unauthorized pupil imagery is displayed.</p></div>
      </div>
      <Container className="relative z-10 py-12 sm:py-16 lg:py-24">
        <div className="max-w-2xl border-l-4 border-accent-gold bg-brand-900 px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Welcome to St. Angella</p>
          <h1 id="home-hero-title" className="mt-5 font-heading text-[clamp(2.55rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-tight">Nurturing Confident Learners <span className="text-accent-gold">for a Brighter Future</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">Discover St. Angella Nursery &amp; Primary School in Kisaasi, Kampala. Detailed school information is being prepared for review and approval.</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent-gold">Provisional homepage copy — pending school approval</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><LinkButton href="/about" variant="gold" showArrow>Discover our school</LinkButton><LinkButton href="/admissions" className="border-white bg-transparent text-white hover:bg-white hover:text-brand-900" showArrow>Admissions</LinkButton></div>
        </div>
      </Container>
    </div>
  </section>;
}
