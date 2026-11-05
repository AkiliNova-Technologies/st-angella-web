import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import type { ContentStatus } from "@/lib/content/lifecycle";
export const instant = false;
const tables = [{table:"page_contents",label:"Page",path:"pages"},{table:"news_articles",label:"News",path:"news"},{table:"school_events",label:"Event",path:"events"}] as const;
type Item = {id:string;title:string;updated_at:string;created_by_id:string;status:string;label:string;href:string};
export default async function ReviewsPage({searchParams}:{searchParams:Promise<{page?:string;status?:string}>}){
 const staff=await requireStaff();
 if(!hasPermission(staff.roles,"content:review")) redirect("/admin/forbidden");
 const params=await searchParams;
 const page=params.page && /^[1-9]\d{0,2}$/.test(params.page)?Number(params.page):1;
 const status=params.status==="APPROVED"?"APPROVED":"IN_REVIEW";
 const pageSize=12;
 const supabase=await createSupabaseServerClient();
 const results=await Promise.all(tables.map(async source=>({source,result:await supabase.from(source.table).select("id,title,updated_at,created_by_id,status",{count:"exact"}).is("deleted_at",null).eq("status",status).order("updated_at",{ascending:false}).range(0,page*pageSize)})));
 const failed=results.some(item=>Boolean(item.result.error));
 const total=results.reduce((n,item)=>n+(item.result.count??0),0);
 const items:Item[]=results.flatMap(({source,result})=>(result.data??[]).map(item=>({...item,label:source.label,href:"/admin/"+source.path+"/"+item.id}))).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)||a.id.localeCompare(b.id)).slice((page-1)*pageSize,page*pageSize);
 const href=(next:number)=>"/admin/reviews?status="+status+"&page="+next;
 return <AdminShell title="Editorial reviews" staff={staff} breadcrumbs={[{label:"Reviews"}]}>
  <p className="mb-5 max-w-3xl text-sm text-muted-foreground">Review submitted content, then publish approved items. Authors cannot approve or publish their own work.</p>
  <nav aria-label="Review status" className="mb-5 flex gap-2"><Link href="/admin/reviews?status=IN_REVIEW" className={"border px-4 py-3 text-sm font-semibold "+(status==="IN_REVIEW"?"bg-brand-800 text-white":"bg-white")}>Awaiting review</Link><Link href="/admin/reviews?status=APPROVED" className={"border px-4 py-3 text-sm font-semibold "+(status==="APPROVED"?"bg-brand-800 text-white":"bg-white")}>Ready to publish</Link></nav>
  {failed?<p role="alert" className="border border-destructive bg-white p-5">Unable to load the review queue. Please retry.</p>:items.length?<div className="overflow-x-auto border bg-white"><table className="w-full min-w-160 text-left text-sm"><thead className="border-b bg-background-warm"><tr><th className="p-4">Content</th><th className="p-4">Type</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y">{items.map(item=><tr key={item.href}><td className="p-4 font-semibold">{item.title}{item.created_by_id===staff.profileId&&<span className="ml-2 text-xs font-normal text-muted-foreground">(Your submission — independent review required)</span>}</td><td className="p-4">{item.label}</td><td className="p-4"><StatusBadge status={item.status as ContentStatus}/></td><td className="p-4"><Link href={item.href} className="inline-block border border-brand-800 px-4 py-2 font-semibold text-brand-800">{item.created_by_id===staff.profileId?"View":"Open workflow"}</Link></td></tr>)}</tbody></table><div className="flex items-center justify-between border-t p-4"><span className="text-xs text-muted-foreground">{total} records · Page {page}</span><div className="flex gap-2">{page>1&&<Link href={href(page-1)} className="border px-3 py-2">Previous</Link>}{page*pageSize<total&&<Link href={href(page+1)} className="border px-3 py-2">Next</Link>}</div></div></div>:<p className="border bg-white p-8 text-sm text-muted-foreground">No content in this queue.</p>}
 </AdminShell>;
}
