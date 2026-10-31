export const instant = false;
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateEnquiryStatusAction } from "./actions";

export default async function EnquiriesAdmin({ searchParams }: { searchParams: Promise<{ type?: string; status?: string; saved?: string; error?: string }> }) {
  const staff = await requireStaff(["SUPER_ADMIN"]); const params = await searchParams;
  const type = params.type === "contact" ? "contact" : "admissions";
  const table = type === "contact" ? "contact_enquiries" : "admission_enquiries";
  const statuses = ["NEW", "IN_PROGRESS", "RESOLVED"] as const;
  const status = statuses.find((item) => item === params.status);
  const supabase = await createSupabaseServerClient();
  let query = supabase.from(table).select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  return <AdminShell title="Enquiries" staff={staff} breadcrumbs={[{ label: "Enquiries" }]}>
    <p className="mb-6 border-l-4 border-accent-gold bg-white p-4 text-sm">Public enquiry submission is currently disabled. This workspace manages existing records only. Personal information must not be shared outside authorized school staff.</p>
    {params.saved && <p role="status" className="mb-4 border bg-white p-3 text-sm">Enquiry updated.</p>}
    {(params.error || error) && <p role="alert" className="mb-4 border border-destructive bg-white p-3 text-sm">Unable to load or update enquiries.</p>}
    <div className="mb-6 flex flex-wrap gap-2">{(["admissions", "contact"] as const).map((item) => <a key={item} href={`/admin/enquiries?type=${item}`} className={`border px-4 py-2 text-sm font-bold ${type === item ? "bg-brand-800 text-white" : "bg-white"}`}>{item === "admissions" ? "Admissions" : "Contact"}</a>)}</div>
    <div className="mb-5 flex flex-wrap gap-2"><a href={`/admin/enquiries?type=${type}`} className="border bg-white px-3 py-2 text-xs font-bold">All</a>{statuses.map((item) => <a key={item} href={`/admin/enquiries?type=${type}&status=${item}`} className={`border px-3 py-2 text-xs font-bold ${status === item ? "bg-brand-800 text-white" : "bg-white"}`}>{item.replaceAll("_", " ")}</a>)}</div>
    {!error && (data?.length ? <div className="space-y-4">{data.map((item) => <article key={item.id} className="border bg-white p-5"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="font-heading text-lg font-bold text-brand-900">{("guardian_name" in item ? item.guardian_name : item.name) as string}</h2><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-UG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))} · {item.status}</p></div><form action={updateEnquiryStatusAction} className="flex items-center gap-2"><input type="hidden" name="type" value={type} /><input type="hidden" name="id" value={item.id} /><label className="sr-only" htmlFor={`status-${item.id}`}>Enquiry status</label><select id={`status-${item.id}`} name="status" defaultValue={item.status} className="min-h-10 border bg-white px-2 text-sm">{statuses.map((value) => <option key={value}>{value}</option>)}</select><button className="bg-brand-800 px-3 py-2 text-sm font-bold text-white">Save</button></form></div><div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><strong>Email:</strong> {item.email}</p><p><strong>Phone:</strong> {item.phone}</p>{"intended_class" in item && <p><strong>Intended class:</strong> {String(item.intended_class)}</p>}</div><p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm">{item.message}</p></article>)}</div> : <AdminEmptyState title="No enquiries found" description="There are no records matching the selected filters." />)}
  </AdminShell>;
}
