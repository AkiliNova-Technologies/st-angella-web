import { FeatureHighlight } from "@/components/cards/feature-highlight";
import { Container } from "@/components/layout/container";
import { homeHighlights } from "@/data/home";

export function Highlights() { return <section className="border-b border-border bg-white py-12" aria-labelledby="highlights-heading"><Container><h2 id="highlights-heading" className="sr-only">What St. Angella values</h2><div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">{homeHighlights.map((item) => <FeatureHighlight key={item.title} {...item} />)}</div></Container></section>; }
