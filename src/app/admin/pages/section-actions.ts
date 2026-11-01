"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isManagedPageSlug, validateManagedPageBody } from "@/lib/content/managed-pages";

export async function saveManagedSectionAction(pageId:string, sectionId:string, formData:FormData) {
 const staff=await requireStaff();
 if(!hasPermission(staff.roles,"content:edit")) redirect("/admin/forbidden");
 const id=z.string().uuid().parse(pageId);
 const db=await createSupabaseServerClient();
 const {data:page}=await db.from("page_contents").select("id,slug,body,status,created_by_id").eq("id",id).single();
 if(!page || !isManagedPageSlug(page.slug)) redirect("/admin/pages");
 if(page.status!=="DRAFT" || (page.created_by_id!==staff.profileId && !staff.roles.includes("SUPER_ADMIN"))) redirect("/admin/forbidden");
 const values=z.object({heading:z.string().trim().max(200),description:z.string().trim().max(5000)}).safeParse(Object.fromEntries(formData));
 if(!values.success) redirect("/admin/pages/"+id+"?section_error=validation");
 let body;
 try { body=validateManagedPageBody(page.slug,page.body); }
 catch { redirect("/admin/pages/"+id+"?section_error=legacy"); }
 if(!body.sections.some(s=>s.id===sectionId)) redirect("/admin/pages/"+id+"?section_error=section");
 const sections=body.sections.map(s=>s.id===sectionId?{...s,...values.data,visible:formData.get("visible")==="on"}:s);
 const {error}=await db.from("page_contents").update({body:{version:1,sections}}).eq("id",id).eq("status","DRAFT");
 if(error) redirect("/admin/pages/"+id+"?section_error=save");
 revalidatePath("/admin/pages/"+id);
 redirect("/admin/pages/"+id+"?section_saved=1");
}
