export const instant = false;
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { hasPermission } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/require-staff";
import { contentStatuses, type ContentStatus } from "@/lib/content/lifecycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PagesAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const staff = await requireStaff(); const { status } = await searchParams; const selected = contentStatuses.includes(status as ContentStatus) ? status as ContentStatus : undefined;
  const supabase = await createSupabaseServerClient(); let query = supabase.from("page_contents").select("id, title, slug, status, updated_at").order("updated_at", { ascending: false }); if (selected) query = query.eq("status", selected); const { data } = await query;
  return <AdminShell title="Pages" staff={staff} breadcrumbs={[{ label: "Pages" }]}><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2"><Link href="/admin/pages" className={`border px-3 py-2 text-xs font-bold ${!selected ? "bg-brand-800 text-white" : "bg-white"}`}>All</Link>{contentStatuses.map((item) => <Link key={item} href={`/admin/pages?status=${item}`} className={`border px-3 py-2 text-xs font-bold ${selected === item ? "bg-brand-800 text-white" : "bg-white"}`}>{item.replace("_", " ")}</Link>)}</div>{hasPermission(staff.roles, "content:edit") && <Link href="/admin/pages/new" className="bg-brand-800 px-4 py-3 text-sm font-bold text-white">Create page</Link>}</div>{data?.length ? <div className="overflow-x-auto border bg-white"><table className="w-full min-w-160 text-left"><thead className="border-b bg-background-warm text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-4">Page</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Updated</th><th className="px-5 py-4"><span className="sr-only">Action</span></th></tr></thead><tbody className="divide-y">{data.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-bold">{item.title}</p><p className="text-xs text-muted-foreground">/{item.slug}</p></td><td className="px-5 py-4"><StatusBadge status={item.status as ContentStatus} /></td><td className="px-5 py-4 text-sm">{new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" }).format(new Date(item.updated_at))}</td><td className="px-5 py-4 text-right"><Link href={`/admin/pages/${item.id}`} className="text-sm font-bold text-brand-800 underline">Open</Link></td></tr>)}</tbody></table></div> : <AdminEmptyState title="No page content found" description="Page content will appear here after verified records are created." />}</AdminShell>;
}
