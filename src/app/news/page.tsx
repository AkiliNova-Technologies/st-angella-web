import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { ContentEmptyState } from "@/components/news/content-empty-state";
import { InteriorHero } from "@/components/sections/interior-hero";
import { ContentSection } from "@/components/sections/content-section";

export const metadata: Metadata = { title: "News & events", description: "Published news and events from St. Angella School." };
export default async function NewsPage() {
  const env = publicEnv();
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const [newsResult, eventsResult] = await Promise.all([
    client.from("news_articles").select("id,slug,title,summary,published_at").eq("status","PUBLISHED").is("deleted_at",null).order("published_at",{ascending:false}).limit(12),
    client.from("school_events").select("id,slug,title,summary,starts_at,location").eq("status","PUBLISHED").is("deleted_at",null).order("starts_at",{ascending:true}).limit(12),
  ]);
  return <><InteriorHero eyebrow="News & events" title="The latest from St. Angella" description="Official school announcements and upcoming events." />
    <ContentSection eyebrow="School news" title="Latest articles">
      {newsResult.error ? <p role="status">School news is temporarily unavailable.</p> : newsResult.data?.length ? <div className="grid gap-5 md:grid-cols-2">{newsResult.data.map(item=><article key={item.id} className="border bg-white p-5"><p className="text-xs text-muted-foreground">{item.published_at ? new Date(item.published_at).toLocaleDateString("en-UG") : "School news"}</p><h3 className="mt-2 font-heading text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm">{item.summary}</p><Link className="mt-4 inline-block font-semibold text-brand-800 underline" href={`/news/${item.slug}`}>Read article</Link></article>)}</div> : <ContentEmptyState type="news" />}
    </ContentSection>
    <ContentSection tone="warm" eyebrow="Calendar" title="Upcoming events">
      {eventsResult.error ? <p role="status">School events are temporarily unavailable.</p> : eventsResult.data?.length ? <div className="grid gap-5 md:grid-cols-2">{eventsResult.data.map(item=><article key={item.id} className="border bg-white p-5"><p className="text-xs text-muted-foreground">{new Date(item.starts_at).toLocaleDateString("en-UG")}</p><h3 className="mt-2 font-heading text-lg font-bold">{item.title}</h3><p className="mt-2 text-sm">{item.summary}</p>{item.location && <p className="mt-2 text-xs">{item.location}</p>}</article>)}</div> : <ContentEmptyState type="events" />}
    </ContentSection></>;
}
