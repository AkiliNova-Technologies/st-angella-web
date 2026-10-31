import { FeaturedMediaPicker } from "@/components/admin/featured-media-picker";
export const instant = false;
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { updateNewsAction } from "@/app/admin/content-actions";
import { requireStaff } from "@/lib/auth/require-staff";
import type { ContentStatus } from "@/lib/content/lifecycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewsEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; created?: string; reviewed?: string; transitioned?: string; error?: string }> }) {
  const feedbackParams = await searchParams;
  const feedback = (["error", "saved", "created", "reviewed", "transitioned"] as const).find((key) => feedbackParams[key]) ;
  const staff = await requireStaff(); const { id } = await params; const supabase = await createSupabaseServerClient(); const {data: featuredAssets} = await supabase.from("media_assets").select("id,alt_text,object_path,is_approved").eq("kind","IMAGE").order("created_at",{ascending:false}).limit(100);
  const [{ data: record }, { data: revisions }] = await Promise.all([
    supabase.from("news_articles").select("id, title, slug, summary, body, status, created_by_id, featured_media_id, updated_at").eq("id", id).is("deleted_at", null).single(),
    supabase.from("content_revisions").select("id, revision_number, created_at, author_id, staff_profiles!content_revisions_author_id_fkey(display_name), content_reviews(id, decision, notes, created_at, staff_profiles!content_reviews_reviewer_id_fkey(display_name))").eq("entity_type", "NEWS_ARTICLE").eq("entity_id", id).order("revision_number", { ascending: false }),
  ]);
  if (!record) notFound(); const save = updateNewsAction.bind(null, id);
  const canEdit = (staff.roles.includes("EDITOR") || staff.roles.includes("SUPER_ADMIN")) && ["DRAFT", "IN_REVIEW"].includes(record.status) && (record.created_by_id === staff.profileId || staff.roles.includes("SUPER_ADMIN"));
  return <AdminShell title={record.title} staff={staff} breadcrumbs={[{ label: "News", href: "/admin/news" }, { label: record.title }]}><ContentEditor record={{ ...record, status: record.status as ContentStatus }} entity="NEWS_ARTICLE" roles={staff.roles} profileId={staff.profileId} saveAction={save} revisions={(revisions ?? []) as never} feedback={feedback}><FeaturedMediaPicker assets={featuredAssets ?? []} selected={record.featured_media_id} disabled={!canEdit} /><div><label htmlFor="summary" className="text-sm font-bold">Summary</label><textarea id="summary" name="summary" defaultValue={record.summary} disabled={!canEdit} required minLength={10} maxLength={500} rows={3} className="mt-2 w-full border p-3" /></div></ContentEditor></AdminShell>;
}
