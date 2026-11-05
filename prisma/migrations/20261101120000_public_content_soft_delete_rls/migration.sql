alter policy pages_public_read on public.page_contents using (status = 'PUBLISHED'::"ContentStatus" and published_at <= now() and deleted_at is null);
alter policy articles_public_read on public.news_articles using (status = 'PUBLISHED'::"ContentStatus" and published_at <= now() and deleted_at is null);
alter policy events_public_read on public.school_events using (status = 'PUBLISHED'::"ContentStatus" and published_at <= now() and deleted_at is null);
