export type NewsArticle = { type: "news"; slug: string; title: string; summary: string; publishedAt: string; image?: { src: string; alt: string }; body: readonly string[] };
export type SchoolEvent = { type: "event"; slug: string; title: string; summary: string; startsAt: string; endsAt?: string; location?: string; image?: { src: string; alt: string } };

// CMS-ready fixtures. Empty until the school supplies approved, genuine content.
export const newsArticles: readonly NewsArticle[] = [];
export const schoolEvents: readonly SchoolEvent[] = [];
