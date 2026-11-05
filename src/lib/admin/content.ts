import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getDashboardData(activityPage = 1, queuePage = 1) {
  const pageSize = 6; const queueLimit = queuePage * pageSize;
  const supabase = await createSupabaseServerClient();
  const tables = ["page_contents", "news_articles", "school_events"] as const;
  const counts = await Promise.all(tables.flatMap((table) => [
    supabase.from(table).select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "PUBLISHED"),
    supabase.from(table).select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "DRAFT"),
    supabase.from(table).select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "IN_REVIEW"),
  ]));
  const sum = (offset: number) => counts.filter((_, index) => index % 3 === offset).reduce((total, result) => total + (result.count ?? 0), 0);
  const [{ count: upcomingEvents }, { data: activity, count: activityCount }, pages, news, events] = await Promise.all([
    supabase.from("school_events").select("id", { count: "exact", head: true }).is("deleted_at", null).gte("starts_at", new Date().toISOString()).neq("status", "ARCHIVED"),
    supabase.from("audit_logs").select("id, action, entity_type, entity_id, created_at", { count: "exact" }).in("entity_type", ["page_contents", "news_articles", "school_events"]).order("created_at", { ascending: false }).range((activityPage - 1) * pageSize, activityPage * pageSize - 1),
    supabase.from("page_contents").select("id, title, updated_at").is("deleted_at", null).eq("status", "IN_REVIEW").order("updated_at", { ascending: false }).limit(queueLimit),
    supabase.from("news_articles").select("id, title, updated_at").eq("status", "IN_REVIEW").limit(4),
    supabase.from("school_events").select("id, title, updated_at").eq("status", "IN_REVIEW").limit(4),
  ]);
  const queue = [
    ...(pages.data ?? []).map((item) => ({ ...item, type: "Page", href: `/admin/pages/${item.id}` })),
    ...(news.data ?? []).map((item) => ({ ...item, type: "News", href: `/admin/news/${item.id}` })),
    ...(events.data ?? []).map((item) => ({ ...item, type: "Event", href: `/admin/events/${item.id}` })),
  ].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice((queuePage - 1) * pageSize, queuePage * pageSize);
  return { published: sum(0), drafts: sum(1), pending: sum(2), upcomingEvents: upcomingEvents ?? 0, activity: activity ?? [], activityCount: activityCount ?? 0, queue, queueHasNext: [pages,news,events].some(result=>(result.data?.length??0)===queueLimit) };
}
