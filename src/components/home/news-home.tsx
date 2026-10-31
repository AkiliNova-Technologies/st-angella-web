import { NewsCard } from "@/components/cards/news-card";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/sections/section-heading";
import { LinkButton } from "@/components/ui/link-button";
import { developmentNews } from "@/data/home";

export function NewsHome() { return <section className="bg-white py-16 lg:py-24" aria-labelledby="news-heading"><Container><div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between"><SectionHeading eyebrow="News & events" title="Latest from St. Angella" description="This development preview shows the future publishing layout. No fictional events or announcements are presented." /><LinkButton href="/news" variant="secondary" showArrow className="self-start md:self-auto">View all news</LinkButton></div><div className="mt-10 grid gap-6 md:grid-cols-3">{developmentNews.map((item) => <NewsCard key={item.title} {...item} />)}</div></Container></section>; }
