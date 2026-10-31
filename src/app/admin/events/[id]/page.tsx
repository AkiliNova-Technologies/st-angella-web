export const instant = false;
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentEditor } from "@/components/admin/content-editor";
import { EventFields } from "@/components/admin/event-fields";
import { updateEventAction } from "@/app/admin/content-actions";
import { requireStaff } from "@/lib/auth/require-staff";
import type { ContentStatus } from "@/lib/content/lifecycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EventEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; created?: string; reviewed?: string; transitioned?: string; error?: string }> }) {
  const feedbackParams = await searchParams;
  const feedback = (["error", "saved", "created", "reviewed", "transitioned"] as const).find((key) => feedbackParams[key]) ;
  const staff = await requireStaff(); const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: record }, { data: revisions }] = await Promise.all([
    supabase.from("school_events").select("id, title, slug, summary, body, starts_at, ends_at, location, status, created_by_id, updated_at").eq("id", id).is("deleted_at", null).single(),
    supabase.from("content_revisions").select("id, revision_number, created_at, author_id, staff_profiles!content_revisions_author_id_fkey(display_name), content_reviews(id, decision, notes, created_at, staff_profiles!content_reviews_reviewer_id_fkey(display_name))").eq("entity_type", "SCHOOL_EVENT").eq("entity_id", id).order("revision_number", { ascending: false }),
  ]);
  if (!record) notFound();
  const canEdit = (staff.roles.includes("EDITOR") || staff.roles.includes("SUPER_ADMIN")) && ["DRAFT", "IN_REVIEW"].includes(record.status) && (record.created_by_id === staff.profileId || staff.roles.includes("SUPER_ADMIN"));
  return <AdminShell title={record.title} staff={staff} breadcrumbs={[{ label: "Events", href: "/admin/events" }, { label: record.title }]}>
    <ContentEditor record={{ ...record, status: record.status as ContentStatus }} entity="SCHOOL_EVENT" roles={staff.roles} profileId={staff.profileId} saveAction={updateEventAction.bind(null, id)} revisions={(revisions ?? []) as never} feedback={feedback}>
      <EventFields record={record} disabled={!canEdit} />
    </ContentEditor>
  </AdminShell>;
}
