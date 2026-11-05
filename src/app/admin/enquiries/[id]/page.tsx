import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { FormSelect } from "@/components/admin/form-select";
import { SubmitButton } from "@/components/admin/submit-button";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateEnquiryStatusAction } from "../actions";
export const instant = false;
const statuses = ["NEW","IN_PROGRESS","RESOLVED"] as const;
export default async function EnquiryDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{type?:string; saved?:string; error?:string}>}) {
 const staff=await requireStaff(["SUPER_ADMIN"]); const {id}=await params; const search=await searchParams;
 const type=search.type==="contact"?"contact":"admissions";
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.from(type==="contact"?"contact_enquiries":"admission_enquiries").select("*").eq("id",id).is("deleted_at",null).maybeSingle();
 if(error||!data) notFound();
 const item=data as Record<string,unknown>;
 const name=String(item.guardian_name??item.name??"Enquiry");
 const date=new Intl.DateTimeFormat("en-UG",{dateStyle:"full",timeStyle:"short",timeZone:"Africa/Kampala"}).format(new Date(String(item.created_at)));
 const field=(label:string,value:unknown)=><div className="border-b py-4"><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-2 break-words text-sm text-brand-900">{value==null||value===""?"Not provided":String(value)}</dd></div>;
 return <AdminShell title={name} staff={staff} breadcrumbs={[{label:"Enquiries",href:"/admin/enquiries?type="+type},{label:"Enquiry details"}]}>
 <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
 <section className="border bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{type==="contact"?"Contact enquiry":"Admissions enquiry"}</p><h2 className="mt-2 font-heading text-xl font-bold text-brand-900">{name}</h2><p className="mt-1 text-xs text-muted-foreground">Received {date}</p></div><span className="border border-brand-800 px-3 py-2 text-xs font-bold text-brand-900">{String(item.status).replaceAll("_"," ")}</span></div>
 <dl className="grid gap-x-8 sm:grid-cols-2">{field("Email",item.email)}{field("Phone",item.phone)}{type==="admissions"&&field("Intended class",item.intended_class)}</dl>
 <div className="mt-6"><h3 className="font-heading text-lg font-bold text-brand-900">Message</h3><p className="mt-3 whitespace-pre-wrap break-words border bg-background-warm p-5 text-sm leading-7">{String(item.message??"")}</p></div>
 <div className="mt-6 border-t pt-5"><Link href={"/admin/enquiries?type="+type} className="inline-flex min-h-11 items-center border border-brand-800 px-5 text-sm font-bold text-brand-800">Back to enquiries</Link></div>
 </section><aside className="space-y-5"><section className="border bg-white p-5"><h2 className="font-heading text-lg font-bold text-brand-900">Manage enquiry</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Update the enquiry status as staff follow up. No email is sent automatically.</p>{search.saved&&<p role="status" className="mt-4 border-l-4 border-brand-800 bg-background-warm p-3 text-sm">Status updated.</p>}{search.error&&<p role="alert" className="mt-4 border-l-4 border-destructive bg-red-50 p-3 text-sm">Update failed.</p>}<form action={updateEnquiryStatusAction} className="mt-5 space-y-4"><input type="hidden" name="id" value={id}/><input type="hidden" name="type" value={type}/><FormSelect name="status" label="Status" defaultValue={String(item.status)} options={statuses.map(value=>({value,label:value.replaceAll("_"," ")}))}/><SubmitButton className="w-full bg-brand-800 px-4 py-3 text-sm font-bold text-white">Save status</SubmitButton></form></section><p className="border-l-4 border-accent-gold bg-white p-4 text-xs leading-6">Personal contact information is confidential. Access and follow-up must comply with the school's retention policy.</p></aside>
 </div></AdminShell>;
}
