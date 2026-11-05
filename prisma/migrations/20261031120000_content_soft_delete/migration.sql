-- Soft deletion for editorial content. Existing records remain intact.
ALTER TABLE public.page_contents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.school_events ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS page_contents_deleted_at_idx ON public.page_contents(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS news_articles_deleted_at_idx ON public.news_articles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS school_events_deleted_at_idx ON public.school_events(deleted_at) WHERE deleted_at IS NOT NULL;
-- Restore uses status DRAFT: previously published records must pass review again.
