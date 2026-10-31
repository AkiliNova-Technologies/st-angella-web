import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDataTable, AdminPagination, parseTablePagination } from "@/components/admin/data-table";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const instant = false;
const statuses = ["NEW", "IN_PROGRESS", "RESOLVED"] as const;
type Enquiry = { id: string; created_at: string; status: string; email: string; message: string; name?: string; guardian_name?: string; intended_class?: string | null };
function link(type: string, status?: string, q?: string) { const p = new URLSearchParams({ type }); if(status) p.set("status",status); if(q) p.set("q",q); return "/admin/enquiries?" + p.toString(); }
export default async function EnquiriesAdmin({ searchParams }: { searchParams: Promise<{ type?: string; status?: string; q?: string; saved?: string; error?: string; page?: string; pageSize?: string }> }) {
  const staff = await requireStaff(["SUPER_ADMIN"]); const params = await searchParams; const { page, pageSize } = parseTablePagination(params);
  const type = params.type === "contact" ? "contact" : "admissions";
  const table = type === "contact" ? "contact_enquiries" : "admission_enquiries";
  const status = statuses.find(item => item === params.status);
  const q = (params.q ?? "").trim().slice(0,100);
  const supabase = await createSupabaseServerClient();
  const [admissions, contacts, statusCounts] = await Promise.all([
    supabase.from("admission_enquiries").select("id", { count: "exact", head: true }).is("deleted_at",null).eq("status","NEW"),
    supabase.from("contact_enquiries").select("id", { count: "exact", head: true }).is("deleted_at",null).eq("status","NEW"),
    Promise.all(statuses.map(s => supabase.from(table).select("id",{count:"exact",head:true}).is("deleted_at",null).eq("status",s)))
  ]);
  let query = supabase.from(table).select("*",{count:"exact"}).is("deleted_at",null).order("created_at",{ascending:false}).order("id",{ascending:false});
  if(status) query = query.eq("status",status);
  // Search by sender or email, with Supabase-safe escaped filter input.
  if(q) { const safe = q.replace(/[,%()\\]/g," ").trim(); if(safe) query = query.or(type === "contact" ? `name.ilike.%${safe}%,email.ilike.%${safe}%` : `guardian_name.ilike.%${safe}%,email.ilike.%${safe}%`); }
  const { data, count, error } = await query.range((page-1)*pageSize,page*pageSize-1);
  const rows = (data ?? []) as Enquiry[];
  const total = statusCounts.reduce((sum,item) => sum + (item.count ?? 0),0);
  const cards = [{ label:"Total", value:total, valueStatus:undefined }, ...statuses.map((s,i)=>({label:s.replaceAll("_"," "),value:statusCounts[i].count ?? 0,valueStatus:s}))];
  const date = (v:string) => new Intl.DateTimeFormat("en-UG",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Kampala"}).format(new Date(v));
  return <AdminShell title="Enquiries" staff={staff} breadcrumbs={[{label:"Enquiries"}]}>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><p className="max-w-2xl text-sm text-muted-foreground">Manage admissions and general contact messages. Enquiry details are restricted to authorized staff.</p></div>
    {params.saved && <p role="status" className="mb-4 border-l-4 border-brand-800 bg-white p-3 text-sm">Enquiry status updated.</p>}
    {(params.error || error) && <p role="alert" className="mb-4 border-l-4 border-destructive bg-white p-3 text-sm">Unable to load or update enquiries.</p>}
    <nav aria-label="Enquiry types" className="mb-5 flex flex-wrap gap-2">{(["admissions","contact"] as const).map(item=><Link key={item} href={link(item)} aria-current={type===item?"page":undefined} className={`border px-5 py-3 text-sm font-bold ${type===item?"border-brand-800 bg-brand-800 text-white":"bg-white text-brand-900 hover:bg-background-warm"}`}>{item==="admissions"?"Admissions":"Contact"} <span className="ml-1 text-xs opacity-80">({item==="admissions"?(admissions.count??0):(contacts.count??0)} new)</span></Link>)}</nav>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(card=><Link key={card.label} href={link(type,card.valueStatus,q)} className={`border bg-white p-5 transition-colors hover:border-brand-800 ${status===card.valueStatus?"border-l-4 border-l-brand-800":"border-border"}`}><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{card.label}</p><p className="mt-2 font-heading text-3xl font-bold text-brand-900">{card.value}</p></Link>)}</div>
    <section className="border border-border bg-white"><div className="flex flex-wrap items-end justify-between gap-4 border-b p-5"><div><h2 className="font-heading text-lg font-bold text-brand-900">{type==="admissions"?"Admissions enquiries":"Contact enquiries"}</h2><p className="mt-1 text-xs text-muted-foreground">Select a record to read the full message and manage its status.</p></div><form action="/admin/enquiries" method="get" className="flex flex-wrap items-end gap-2"><input type="hidden" name="type" value={type}/>{status&&<input type="hidden" name="status" value={status}/>}<div><label htmlFor="enquiry-search" className="mb-1 block text-xs font-bold">Search sender or email</label><input id="enquiry-search" name="q" defaultValue={q} placeholder="Search enquiries" maxLength={100} className="min-h-10 w-56 border px-3 text-sm"/></div><button type="submit" className="min-h-10 bg-brand-800 px-4 text-sm font-bold text-white">Search</button>{q&&<Link href={link(type,status)} className="inline-flex min-h-10 items-center border px-3 text-sm">Clear</Link>}</form></div>
    <AdminDataTable rows={rows} columns={[
      {key:"sender",title:"Sender",render:item=><div><Link href={`/admin/enquiries/${item.id}?type=${type}`} className="font-bold text-brand-900 underline-offset-2 hover:underline">{item.guardian_name??item.name??"Unknown"}</Link><p className="mt-1 text-xs text-muted-foreground">{item.email}</p></div>},
      {key:"context",title:type==="admissions"?"Intended class":"Message",render:item=><span className="block max-w-72 truncate text-muted-foreground">{type==="admissions"?(item.intended_class||"Not specified"):item.message}</span>},
      {key:"date",title:"Received",render:item=><span className="whitespace-nowrap text-xs">{date(item.created_at)}</span>},
      {key:"status",title:"Status",render:item=><span className={`inline-flex border px-2 py-1 text-xs font-bold ${item.status==="NEW"?"border-amber-300 bg-amber-50 text-amber-900":item.status==="RESOLVED"?"border-emerald-300 bg-emerald-50 text-emerald-900":"border-brand-800 bg-background-warm text-brand-900"}`}>{item.status.replaceAll("_"," ")}</span>},
      {key:"action",title:"",render:item=><Link href={`/admin/enquiries/${item.id}?type=${type}`} className="whitespace-nowrap border border-brand-800 px-3 py-2 text-xs font-bold text-brand-800 hover:bg-background-warm">View details</Link>}
    ]} empty={<p>No enquiries match the selected filters.</p>} pagination={<AdminPagination basePath="/admin/enquiries" params={{type,status,q}} page={page} pageSize={pageSize} total={count??0}/>}/>
    </section>
  </AdminShell>;
}
