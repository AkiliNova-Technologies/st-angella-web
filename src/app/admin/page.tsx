import Link from "next/link";
import { ArrowRight, CalendarClock, FileCheck2, FilePenLine, Send } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { requireStaff } from "@/lib/auth/require-staff";
import { getDashboardData } from "@/lib/admin/content";
export const instant = false;
export const metadata = { title: "Administration overview" };
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ activityPage?: string; queuePage?: string }> }) {
  const staff = await requireStaff(); const params = await searchParams;
  const parsePage = (value?: string) => value && /^[1-9]\d{0,3}$/.test(value) ? Math.min(Number(value), 1000) : 1;
  const activityPage = parsePage(params.activityPage), queuePage = parsePage(params.queuePage);
  const data = await getDashboardData(activityPage, queuePage);
  const metrics = [
    { label: "Published content", value: data.published, icon: FileCheck2 },
    { label: "Draft content", value: data.drafts, icon: FilePenLine },
    { label: "Pending review", value: data.pending, icon: Send },
    { label: "Upcoming events", value: data.upcomingEvents, icon: CalendarClock },
  ];
  return <AdminShell title="Overview" staff={staff}>
    <section aria-label="Content summary" className="grid gap-px border bg-border sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => <article key={label} className="bg-white p-6"><div className="flex items-start justify-between"><p className="text-sm font-semibold text-muted-foreground">{label}</p><Icon className="size-5 text-accent-gold" aria-hidden="true" /></div><p className="mt-5 font-heading text-4xl font-bold text-brand-900">{value}</p></article>)}
    </section>
    <div className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
      <section className="border bg-white" aria-labelledby="approval-heading"><div className="border-b px-6 py-5"><h2 id="approval-heading" className="font-heading text-xl font-bold text-brand-900">Pending approval queue</h2><p className="mt-1 text-sm text-muted-foreground">Content submitted for independent review.</p></div>{data.queue.length ? <ul className="divide-y">{data.queue.map((item) => <li key={`${item.type}-${item.id}`}><Link href={item.href} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-background-warm"><span><span className="text-xs font-bold uppercase tracking-wider text-brand-800">{item.type}</span><span className="mt-1 block font-semibold">{item.title}</span></span><ArrowRight className="size-4" aria-hidden="true" /></Link></li>)}</ul> : <div className="p-6"><AdminEmptyState title="The review queue is clear" description="Submitted pages, news articles, and events will appear here." /></div>}<div className="flex items-center justify-between border-t px-6 py-3 text-sm"><span>Page {queuePage}</span><div className="flex gap-3">{queuePage > 1 && <Link href={`/admin?queuePage=${queuePage-1}&activityPage=${activityPage}`} className="border px-3 py-2">Previous</Link>}{data.queueHasNext && <Link href={`/admin?queuePage=${queuePage+1}&activityPage=${activityPage}`} className="border px-3 py-2">Next</Link>}</div></div></section>
      <aside className="space-y-8"><section className="border bg-brand-900 p-6 text-white"><h2 className="font-heading text-xl font-bold">Quick actions</h2><div className="mt-5 grid gap-3"><Link href="/admin/news/new" className="bg-accent-gold px-4 py-3 text-center text-sm font-bold text-brand-900">Create news article</Link><Link href="/admin/pages/new" className="border border-white/30 px-4 py-3 text-center text-sm font-bold text-white">Create page</Link><Link href="/admin/events/new" className="border border-white/30 px-4 py-3 text-center text-sm font-bold text-white">Create event</Link></div></section><section className="border bg-white"><div className="border-b px-6 py-5"><h2 className="font-heading text-xl font-bold text-brand-900">Recent activity</h2></div>{data.activity.length ? <ul className="divide-y">{data.activity.map((item) => <li key={item.id} className="px-6 py-4"><p className="text-sm font-semibold">{item.action} · {item.entity_type.replaceAll("_", " ")}</p><time className="mt-1 block text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-UG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</time></li>)}</ul> : <p className="px-6 py-8 text-sm text-muted-foreground">No content activity has been recorded yet.</p>}<div className="flex items-center justify-between border-t px-6 py-3 text-sm"><span>Page {activityPage} · {data.activityCount} activities</span><div className="flex gap-2">{activityPage > 1 && <Link href={`/admin?activityPage=${activityPage-1}&queuePage=${queuePage}`} className="border px-3 py-2">Previous</Link>}{activityPage*6 < data.activityCount && <Link href={`/admin?activityPage=${activityPage+1}&queuePage=${queuePage}`} className="border px-3 py-2">Next</Link>}</div></div></section></aside>
    </div>
  </AdminShell>;
}
