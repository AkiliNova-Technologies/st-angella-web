"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const nameSchema = z.string().trim().min(2).max(70).regex(/^[\p{L}\p{N}][\p{L}\p{N} &,'()/-]*$/u);
const idSchema = z.string().uuid();
function slugify(name: string) {
 return name.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
}
async function authorized() {
 await requireStaff(["SUPER_ADMIN"]);
 return createSupabaseServerClient();
}
function done() {
 revalidatePath("/admin/gallery");
 revalidatePath("/admin/media");
 revalidatePath("/gallery");
 redirect("/admin/gallery?categories=updated");
}
export async function createGalleryCategoryAction(formData: FormData) {
 const supabase=await authorized();
 const parsed=nameSchema.safeParse(formData.get("name"));
 if(!parsed.success) redirect("/admin/gallery?categories=invalid");
 const slug=slugify(parsed.data);
 if(!slug) redirect("/admin/gallery?categories=invalid");
 const {error}=await supabase.from("media_categories").insert({name:parsed.data,slug});
 if(error) { console.error("Category create failed",error.code); redirect("/admin/gallery?categories=failed"); }
 done();
}
export async function renameGalleryCategoryAction(formData: FormData) {
 const supabase=await authorized();
 const id=idSchema.safeParse(formData.get("id"));
 const name=nameSchema.safeParse(formData.get("name"));
 if(!id.success || !name.success) redirect("/admin/gallery?categories=invalid");
 const slug=slugify(name.data);
 if(!slug) redirect("/admin/gallery?categories=invalid");
 const {data,error}=await supabase.from("media_categories").update({name:name.data,slug}).eq("id",id.data).select("id").single();
 if(error || !data) {console.error("Category rename failed",error?.code); redirect("/admin/gallery?categories=failed");}
 done();
}
export async function deleteGalleryCategoryAction(formData: FormData) {
 const supabase=await authorized();
 const id=idSchema.safeParse(formData.get("id"));
 if(!id.success) redirect("/admin/gallery?categories=invalid");
 const {count,error:countError}=await supabase.from("media_assets").select("id",{count:"exact",head:true}).eq("category_id",id.data);
 if(countError || count===null) redirect("/admin/gallery?categories=failed");
 if(count>0) redirect("/admin/gallery?categories=inuse");
 const {data,error}=await supabase.from("media_categories").delete().eq("id",id.data).select("id").single();
 if(error || !data) {console.error("Category delete failed",error?.code);redirect("/admin/gallery?categories=failed");}
 done();
}
