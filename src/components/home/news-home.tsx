import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { NewsCard } from "@/components/cards/news-card";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/sections/section-heading";
import { LinkButton } from "@/components/ui/link-button";

export async function NewsHome() {
 const env=publicEnv();
 const client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:articles,error}=await client.from("news_articles").select("id,slug,title,summary,published_at").eq("status","PUBLISHED").is("deleted_at",null).order("published_at",{ascending:false}).limit(3);
 return <section className="bg-white py-16 lg:py-24" aria-labelledby="news-heading"><Container><div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between"><SectionHeading eyebrow="News & events" title="Latest from St. Angella" description="Official announcements and stories from our school community." /><LinkButton href="/news" variant="secondary" showArrow className="self-start md:self-auto">View all news</LinkButton></div>{error ? <p className="mt-8 text-sm text-muted-foreground">School news is temporarily unavailable.</p> : articles?.length ? <div className="mt-10 grid gap-6 md:grid-cols-3">{articles.map(item=><NewsCard key={item.id} title={item.title} summary={item.summary??""} href={`/news/${item.slug}`} date={item.published_at?new Date(item.published_at).toLocaleDateString("en-UG"):undefined}/>)}</div> : <p className="mt-8 border bg-background-warm p-6 text-sm text-muted-foreground">Official school news will appear here once published.</p>}</Container></section>;
}
