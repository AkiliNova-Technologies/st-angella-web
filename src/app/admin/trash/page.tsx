import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AdminPagination, parseTablePagination } from "@/components/admin/data-table";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentRemovalControl } from "@/components/admin/content-removal-control";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export const instant = false;
const sources = [{ table:"page_contents", entity:"PAGE", label:"Page" },{table:"news_articles",entity:"NEWS_ARTICLE",label:"News"},{table:"school_events",entity:"SCHOOL_EVENT",label:"Event"}] as const;
export default async function TrashPage({ searchParams }: { searchParams: Promise<{page?:string;pageSize?:string}> }) {
 const staff=await requireStaff(["SUPER_ADMIN"]); const admin=createSupabaseAdminClient();
 const params=await searchParams; const parsed=parseTablePagination(params);
 const page=parsed.page; const pageSize=parsed.pageSize;
 // Fetch enough from each source to produce a correctly ordered combined page.
 const limit=page*pageSize;
 const results=await Promise.all(sources.map(async source=>({source,result:await admin.from(source.table).select("id,title,deleted_at",{count:"exact"}).not("deleted_at","is",null).order("deleted_at",{ascending:false}).range(0,limit-1)})));
 const failed=results.some(({result})=>Boolean(result.error));
 const total=results.reduce((sum,{result})=>sum+(result.count??0),0);
 const items=results.flatMap(({source,result})=>(result.data??[]).map(item=>({...item,source})))
  .sort((a,b)=>new Date(b.deleted_at!).getTime()-new Date(a.deleted_at!).getTime() || a.id.localeCompare(b.id))
  .slice((page-1)*pageSize,page*pageSize);
 return <AdminShell title="Trash" staff={staff} breadcrumbs={[{label:"Trash"}]}><p className="mb-6 text-sm text-muted-foreground">Deleted content remains recoverable. Restored content returns to draft and requires editorial review before publishing.</p>{failed && <p role="alert" className="mb-4 border border-destructive p-3 text-sm">Unable to load all deleted content. Please retry.</p>}{!failed && items.length===0 ? <section className="border bg-white px-6 py-16 text-center"><Trash2 className="mx-auto size-10 text-brand-800/60" aria-hidden="true"/><h2 className="mt-4 font-heading text-xl font-bold text-brand-900">Trash is empty</h2><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Deleted pages, news articles and events will appear here. Nothing needs to be restored right now.</p><Link href="/admin/pages" className="mt-6 inline-block bg-brand-800 px-5 py-3 text-sm font-bold text-white">Browse content</Link></section> : !failed ? <div className="overflow-x-auto border bg-white"><table className="w-full min-w-160 text-left text-sm"><thead className="border-b bg-background-warm"><tr><th className="p-4">Content</th><th className="p-4">Type</th><th className="p-4">Deleted</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y">{items.map(item=><tr key={item.source.entity+item.id}><td className="p-4 font-semibold">{item.title}</td><td className="p-4">{item.source.label}</td><td className="p-4">{item.deleted_at ? new Date(item.deleted_at).toLocaleDateString("en-UG"):"—"}</td><td className="p-4"><ContentRemovalControl entity={item.source.entity} id={item.id} title={item.title} operation="restore" /></td></tr>)}</tbody></table><AdminPagination basePath="/admin/trash" params={{}} page={page} pageSize={pageSize} total={total}/></div> : null}<Link href="/admin" className="mt-5 inline-block border px-5 py-3 text-sm font-semibold">Back to dashboard</Link></AdminShell>;
}
