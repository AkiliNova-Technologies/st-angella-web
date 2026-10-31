import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { newsArticles } from "@/data/news";
export const instant = false;
type ArticlePageProps = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> { const { slug } = await params; const article = newsArticles.find((item) => item.slug === slug); return article ? { title: article.title, description: article.summary } : {}; }
export default async function NewsArticlePage({ params }: ArticlePageProps) { const { slug } = await params; const article = newsArticles.find((item) => item.slug === slug); if (!article) notFound(); return <article className="py-16 lg:py-24"><Container><header className="max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-800">School news · <time dateTime={article.publishedAt}>{article.publishedAt}</time></p><h1 className="mt-5 font-heading text-4xl font-extrabold text-brand-900 sm:text-5xl">{article.title}</h1><p className="mt-5 text-lg text-muted-foreground">{article.summary}</p></header><div className="mt-10 max-w-3xl space-y-5 text-foreground">{article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></Container></article>; }
