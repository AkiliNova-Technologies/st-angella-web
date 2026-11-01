"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emptyManagedPageBody, isManagedPageSlug, managedPages } from "@/lib/content/managed-pages";

export async function initializeManagedPageAction(formData:FormData) {
 const staff=await requireStaff();
 if(!staff.roles.includes("SUPER_ADMIN")) redirect("/admin/forbidden");
 const slug=formData.get("slug");
 if(typeof slug!=="string" || !isManagedPageSlug(slug)) redirect("/admin/pages");
 const db=await createSupabaseServerClient();
 const {data:existing,error:lookupError}=await db.from("page_contents").select("id").eq("slug",slug).is("deleted_at",null).limit(1);
 if(lookupError) redirect("/admin/pages?init_error=lookup");
 if(existing?.length) redirect("/admin/pages/"+existing[0].id);
 const {data,error}=await db.from("page_contents").insert({title:managedPages[slug].title,slug,body:emptyManagedPageBody(slug),status:"DRAFT",created_by_id:staff.profileId}).select("id").single();
 if(error || !data) redirect("/admin/pages?init_error=save");
 revalidatePath("/admin/pages");
 redirect("/admin/pages/"+data.id);
}
