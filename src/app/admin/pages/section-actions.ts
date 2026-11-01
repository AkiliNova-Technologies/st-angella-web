"use server";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/require-staff";
export async function saveManagedSectionAction(_pageId:string,_sectionId:string,_formData:FormData) {
 await requireStaff();
 redirect("/admin/pages?error=not_ready");
}
