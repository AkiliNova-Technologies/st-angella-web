export const instant = false;
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasPermission } from "@/lib/auth/permissions";
import { contentStatuses, type ContentStatus } from "@/lib/content/lifecycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EventsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const staff = await requireStaff();
  const { status } = await searchParams;
  const selected = contentStatuses.includes(status as ContentStatus) ? status as ContentStatus : undefined;
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("school_events").select("id, title, summary, starts_at, location, status").order("starts_at", { ascending: false });
  if (selected) query = query.eq("status", selected);
  const { data, error } = await query;
  return <AdminShell title="Events" staff={staff} breadcrumbs={[{ label: "Events" }]}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2"><Link href="/admin/events" className={`border px-3 py-2 text-xs font-bold ${!selected ? "bg-brand-800 text-white" : "bg-white"}`}>All</Link>{contentStatuses.map((item) => <Link key={item} href={`/admin/events?status=${item}`} className={`border px-3 py-2 text-xs font-bold ${selected === item ? "bg-brand-800 text-white" : "bg-white"}`}>{item.replaceAll("_", " ")}</Link>)}</div>
      {hasPermission(staff.roles, "content:edit") && <Link href="/admin/events/new" className="bg-brand-800 px-4 py-3 text-sm font-bold text-white">Create event</Link>}
    </div>
    {error ? <p role="alert" className="border border-destructive bg-white p-5">Events could not be loaded. Please try again.</p> : data?.length ? <div className="overflow-x-auto border bg-white"><table className="w-full min-w-180 text-left"><thead className="border-b bg-background-warm text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-4">Event</th><th className="px-5 py-4">Starts</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th></tr></thead><tbody className="divide-y">{data.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-bold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.location || "Location not specified"}</p></td><td className="px-5 py-4 text-sm">{new Intl.DateTimeFormat("en-UG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Kampala" }).format(new Date(item.starts_at))}</td><td className="px-5 py-4"><StatusBadge status={item.status as ContentStatus} /></td><td className="px-5 py-4"><Link href={`/admin/events/${item.id}`} className="text-sm font-bold text-brand-800 underline">Open</Link></td></tr>)}</tbody></table></div> : <AdminEmptyState title="No events found" description="Create a draft for a verified school event." action={hasPermission(staff.roles, "content:edit") ? <Link href="/admin/events/new" className="inline-block bg-brand-800 px-5 py-3 text-sm font-bold text-white">Create first event</Link> : undefined} />}
  </AdminShell>;
}
