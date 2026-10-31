import { ProgrammeCard } from "@/components/cards/programme-card";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/sections/section-heading";

export function Programmes() { return <section className="bg-background-warm py-16 lg:py-24" aria-labelledby="programmes-heading"><Container><SectionHeading eyebrow="Our academic programmes" title="Learning at every stage" description="Explore the nursery and primary programme routes. Detailed curriculum information remains subject to school verification." /><div className="mt-10 grid gap-6 xl:grid-cols-2"><ProgrammeCard title="Nursery Education" description="Programme overview and approved learning information will be published after school review." href="/academics" /><ProgrammeCard title="Primary Education (P1–P7)" description="Programme overview and approved curriculum information will be published after school review." href="/academics" /></div></Container></section>; }
