import type { Metadata } from "next";
import { ContentEmptyState } from "@/components/news/content-empty-state";
import { InteriorHero } from "@/components/sections/interior-hero";
import { ContentSection } from "@/components/sections/content-section";
import { newsArticles, schoolEvents } from "@/data/news";
export const metadata: Metadata = { title: "News & events", description: "Published news and events from St. Angella School." };
export default function NewsPage() { return <><InteriorHero eyebrow="News & events" title="The latest from St. Angella" description="Genuine school articles and verified events will be published here with clear dates, metadata, and imagery." /><ContentSection eyebrow="School news" title="Latest articles">{newsArticles.length === 0 ? <ContentEmptyState type="news" /> : null}</ContentSection><ContentSection tone="warm" eyebrow="Calendar" title="Upcoming events">{schoolEvents.length === 0 ? <ContentEmptyState type="events" /> : null}</ContentSection></>; }
