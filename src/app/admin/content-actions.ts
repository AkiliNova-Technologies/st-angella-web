"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const slugSchema = z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const entitySchema = z.enum(["PAGE", "NEWS_ARTICLE", "SCHOOL_EVENT"]);
const statusSchema = z.enum(["IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED", "DRAFT"]);
const tableByEntity = { PAGE: "page_contents", NEWS_ARTICLE: "news_articles", SCHOOL_EVENT: "school_events" } as const;
const pathByEntity = { PAGE: "/admin/pages", NEWS_ARTICLE: "/admin/news", SCHOOL_EVENT: "/admin/events" } as const;

function parseBody(value: FormDataEntryValue | null) {
  const text = z.string().trim().min(1).max(100_000).parse(value);
  return { html: text };
}

function redirectWith(path: string, kind: "saved" | "created" | "transitioned" | "reviewed" | "error"): never {
  redirect(`${path}?${kind}=1`);
}

export async function createPageAction(formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
  const parsed = z.object({ title: z.string().trim().min(2).max(200), slug: slugSchema }).safeParse({ title: formData.get("title"), slug: formData.get("slug") });
  if (!parsed.success) redirectWith("/admin/pages/new", "error");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("page_contents").insert({ ...parsed.data, body: parseBody(formData.get("body")), created_by_id: staff.profileId, status: "DRAFT" }).select("id").single();
  if (error || !data) redirectWith("/admin/pages/new", "error");
  revalidatePath("/admin/pages");
  redirectWith(`/admin/pages/${data.id}`, "created");
}

export async function updatePageAction(id: string, formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
  const values = z.object({ title: z.string().trim().min(2).max(200), slug: slugSchema }).parse({ title: formData.get("title"), slug: formData.get("slug") });
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.from("page_contents").select("id, created_by_id, status").eq("id", idSchema.parse(id)).single();
  if (!current || !["DRAFT", "IN_REVIEW"].includes(current.status) || (current.created_by_id !== staff.profileId && !staff.roles.includes("SUPER_ADMIN"))) redirect("/admin/forbidden");
  const { error } = await supabase.from("page_contents").update({ ...values, body: parseBody(formData.get("body")) }).eq("id", current.id);
  if (error) redirectWith(`/admin/pages/${current.id}`, "error");
  revalidatePath("/admin/pages"); revalidatePath(`/admin/pages/${current.id}`);
  redirectWith(`/admin/pages/${current.id}`, "saved");
}

export async function createNewsAction(formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
  const values = z.object({ title: z.string().trim().min(2).max(200), slug: slugSchema, summary: z.string().trim().min(10).max(500) }).parse({ title: formData.get("title"), slug: formData.get("slug"), summary: formData.get("summary") });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("news_articles").insert({ ...values, body: parseBody(formData.get("body")), created_by_id: staff.profileId, status: "DRAFT" }).select("id").single();
  if (error || !data) redirectWith("/admin/news/new", "error");
  revalidatePath("/admin/news");
  redirectWith(`/admin/news/${data.id}`, "created");
}

export async function updateNewsAction(id: string, formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
  const values = z.object({ title: z.string().trim().min(2).max(200), slug: slugSchema, summary: z.string().trim().min(10).max(500) }).parse({ title: formData.get("title"), slug: formData.get("slug"), summary: formData.get("summary") });
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.from("news_articles").select("id, created_by_id, status").eq("id", idSchema.parse(id)).single();
  if (!current || !["DRAFT", "IN_REVIEW"].includes(current.status) || (current.created_by_id !== staff.profileId && !staff.roles.includes("SUPER_ADMIN"))) redirect("/admin/forbidden");
  const { error } = await supabase.from("news_articles").update({ ...values, body: parseBody(formData.get("body")) }).eq("id", current.id);
  if (error) redirectWith(`/admin/news/${current.id}`, "error");
  revalidatePath("/admin/news"); revalidatePath(`/admin/news/${current.id}`);
  redirectWith(`/admin/news/${current.id}`, "saved");
}


const eventFieldsSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: slugSchema,
  summary: z.string().trim().min(10).max(500),
  starts_at: z.string().min(16),
  ends_at: z.string().optional(),
  location: z.string().trim().max(240).optional(),
});
function eventValues(formData: FormData) {
  const values = eventFieldsSchema.parse(Object.fromEntries(["title", "slug", "summary", "starts_at", "ends_at", "location"].map((key) => [key, String(formData.get(key) ?? "")])));
  const parseDate = (value: string) => {
    const date = new Date(value + ":00+03:00");
    if (Number.isNaN(date.getTime())) throw new Error("Invalid event date");
    return date.toISOString();
  };
  const starts_at = parseDate(values.starts_at);
  const ends_at = values.ends_at ? parseDate(values.ends_at) : null;
  if (ends_at && ends_at <= starts_at) throw new Error("Event end must follow start");
  return { title: values.title, slug: values.slug, summary: values.summary, starts_at, ends_at, location: values.location || null, body: parseBody(formData.get("body")) };
}
export async function createEventAction(formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
  const values = eventValues(formData);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("school_events").insert({ ...values, created_by_id: staff.profileId, status: "DRAFT" }).select("id").single();
  if (error || !data) redirectWith("/admin/events/new", "error");
  revalidatePath("/admin/events");
  redirectWith(`/admin/events/${data.id}`, "created");
}
export async function updateEventAction(id: string, formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
  const values = eventValues(formData);
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.from("school_events").select("id, created_by_id, status").eq("id", idSchema.parse(id)).single();
  if (!current || !["DRAFT", "IN_REVIEW"].includes(current.status) || (current.created_by_id !== staff.profileId && !staff.roles.includes("SUPER_ADMIN"))) redirect("/admin/forbidden");
  const { error } = await supabase.from("school_events").update(values).eq("id", current.id);
  if (error) redirectWith(`/admin/events/${current.id}`, "error");
  revalidatePath("/admin/events"); revalidatePath(`/admin/events/${current.id}`);
  redirectWith(`/admin/events/${current.id}`, "saved");
}

export async function transitionContentAction(entityInput: string, idInput: string, targetInput: string) {
  const staff = await requireStaff();
  const entity = entitySchema.parse(entityInput); const id = idSchema.parse(idInput); const target = statusSchema.parse(targetInput);
  const supabase = await createSupabaseServerClient(); const table = tableByEntity[entity]; const basePath = pathByEntity[entity];
  if (target === "IN_REVIEW") {
    if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
    const { data: record } = await supabase.from(table).select("*").eq("id", id).single();
    if (!record || record.created_by_id !== staff.profileId || record.status !== "DRAFT") redirect("/admin/forbidden");
    const { data: latest } = await supabase.from("content_revisions").select("revision_number").eq("entity_type", entity).eq("entity_id", id).order("revision_number", { ascending: false }).limit(1).maybeSingle();
    const { error: revisionError } = await supabase.from("content_revisions").insert({ entity_type: entity, entity_id: id, revision_number: (latest?.revision_number ?? 0) + 1, snapshot: record, author_id: staff.profileId });
    if (revisionError) { console.error("Content revision creation failed", { entity, id, code: revisionError.code, message: revisionError.message }); redirectWith(`${basePath}/${id}`, "error"); }
  }
  const { error } = await supabase.rpc("transition_content", { entity_type: entity, entity_id: id, target_status: target });
  if (error) { console.error("Content transition failed", { entity, id, target, code: error.code, message: error.message }); redirectWith(`${basePath}/${id}`, "error"); }
  revalidatePath("/admin"); revalidatePath(basePath); revalidatePath(`${basePath}/${id}`);
  redirectWith(`${basePath}/${id}`, "transitioned");
}

export async function reviewContentAction(entityInput: string, idInput: string, formData: FormData) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:review")) redirect("/admin/forbidden");
  const entity = entitySchema.parse(entityInput); const id = idSchema.parse(idInput);
  const values = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), notes: z.string().trim().max(2000).optional() }).parse({ decision: formData.get("decision"), notes: formData.get("notes") || undefined });
  const supabase = await createSupabaseServerClient(); const basePath = pathByEntity[entity];
  const { data: revision } = await supabase.from("content_revisions").select("id, author_id").eq("entity_type", entity).eq("entity_id", id).order("revision_number", { ascending: false }).limit(1).single();
  if (!revision || revision.author_id === staff.profileId) redirect("/admin/forbidden");
  const { error: reviewError } = await supabase.from("content_reviews").insert({ revision_id: revision.id, reviewer_id: staff.profileId, decision: values.decision, notes: values.notes ?? null });
  if (reviewError) redirectWith(`${basePath}/${id}`, "error");
  if (values.decision === "APPROVED") {
    const { error } = await supabase.rpc("transition_content", { entity_type: entity, entity_id: id, target_status: "APPROVED" });
    if (error) redirectWith(`${basePath}/${id}`, "error");
  }
  revalidatePath("/admin"); revalidatePath(basePath); revalidatePath(`${basePath}/${id}`);
  redirectWith(`${basePath}/${id}`, "reviewed");
}
