import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentRemovalControl } from "@/components/admin/content-removal-control";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export const instant = false;
const sources = [{ table:"page_contents", entity:"PAGE", label:"Page" },{table:"news_articles",entity:"NEWS_ARTICLE",label:"News"},{table:"school_events",entity:"SCHOOL_EVENT",label:"Event"}] as const;
export default async function TrashPage() {
 const staff=await requireStaff(["SUPER_ADMIN"]); const admin=createSupabaseAdminClient();
 const results=await Promise.all(sources.map(async source=>({source, result:await admin.from(source.table).select("id,title,deleted_at").not("deleted_at","is",null).order("deleted_at",{ascending:false}).limit(100)})));
 return <AdminShell title="Trash" staff={staff} breadcrumbs={[{label:"Trash"}]}><p className="mb-6 text-sm text-muted-foreground">Deleted content remains recoverable. Restored content returns to draft and requires editorial review before publishing.</p><div className="overflow-x-auto border bg-white"><table className="w-full min-w-160 text-left text-sm"><thead className="border-b bg-background-warm"><tr><th className="p-4">Content</th><th className="p-4">Type</th><th className="p-4">Deleted</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y">{results.flatMap(({source,result})=>(result.data??[]).map(item=><tr key={source.entity+item.id}><td className="p-4 font-semibold">{item.title}</td><td className="p-4">{source.label}</td><td className="p-4">{item.deleted_at ? new Date(item.deleted_at).toLocaleDateString("en-UG"):"—"}</td><td className="p-4"><ContentRemovalControl entity={source.entity} id={item.id} title={item.title} operation="restore" /></td></tr>))}</tbody></table></div><Link href="/admin" className="mt-5 inline-block border px-5 py-3 text-sm font-semibold">Back to dashboard</Link></AdminShell>;
}
