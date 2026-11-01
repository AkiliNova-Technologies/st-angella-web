import { FormSelect } from "@/components/admin/form-select";
import Link from "next/link";
import { RichTextEditor } from "./rich-text-editor";
import { SubmitButton } from "./submit-button";
import type { StaffRole } from "@/lib/auth/permissions";
import type { ContentStatus } from "@/lib/content/lifecycle";
import { StatusBadge } from "./status-badge";
import { reviewContentAction, transitionContentAction } from "@/app/admin/content-actions";

type Revision = { id: string; revision_number: number; created_at: string; author_id: string; staff_profiles: { display_name: string } | null; content_reviews: { id: string; decision: string; notes: string | null; created_at: string; staff_profiles: { display_name: string } | null }[] };

export function ContentEditor({ record, entity, roles, profileId, saveAction, revisions = [], children, feedback, structured = false }: {
  record: { id: string; title: string; slug: string; body: unknown; status: ContentStatus; created_by_id: string; updated_at: string };
  entity: "PAGE" | "NEWS_ARTICLE" | "SCHOOL_EVENT";
  roles: StaffRole[];
  profileId: string;
  saveAction: (formData: FormData) => void | Promise<void>;
  revisions?: Revision[];
  children?: React.ReactNode;
  structured?: boolean;
  feedback?: "saved" | "created" | "transitioned" | "reviewed" | "error";
}) {
  const backHref = entity === "PAGE" ? "/admin/pages" : entity === "NEWS_ARTICLE" ? "/admin/news" : "/admin/events";
  const bodyValue = record.body && typeof record.body === "object" ? record.body as { html?: string; text?: string } : null;
  const initialHtml = bodyValue?.html ?? (bodyValue?.text ? bodyValue.text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\\n", "<br>") : typeof record.body === "string" ? record.body : "");
  const isSuper = roles.includes("SUPER_ADMIN");
  const canEdit = (roles.includes("EDITOR") || isSuper) && ["DRAFT", "IN_REVIEW"].includes(record.status) && (record.created_by_id === profileId || isSuper);
  const canSubmit = record.status === "DRAFT" && record.created_by_id === profileId && (roles.includes("EDITOR") || isSuper);
  const canReturnToDraft = record.status === "IN_REVIEW" && record.created_by_id === profileId && (roles.includes("EDITOR") || isSuper);
  const latest = revisions[0];
  const canReview = record.status === "IN_REVIEW" && latest && latest.author_id !== profileId && record.created_by_id !== profileId && (roles.includes("REVIEWER") || isSuper);
  const canPublish = record.status === "APPROVED" && record.created_by_id !== profileId && (roles.includes("REVIEWER") || isSuper) && Boolean(latest?.content_reviews.some(item => item.decision === "APPROVED"));
  const canArchive = record.status === "PUBLISHED" && (roles.includes("REVIEWER") || isSuper);
  const transition = transitionContentAction.bind(null, entity, record.id);
  const review = reviewContentAction.bind(null, entity, record.id);
  return <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <section className="border bg-white">
      {feedback && <p role={feedback === "error" ? "alert" : "status"} className={`m-5 border-l-4 p-4 text-sm ${feedback === "error" ? "border-destructive bg-red-50" : "border-brand-800 bg-background-soft"}`}>{feedback === "error" ? "Action failed. Please review the record and try again." : feedback === "saved" ? "Changes saved." : feedback === "created" ? "Draft created." : feedback === "reviewed" ? "Review recorded." : "Workflow status updated."}</p>}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5"><div><h2 className="font-heading text-xl font-bold text-brand-900">Content</h2><p className="mt-1 text-xs text-muted-foreground">Last updated {new Intl.DateTimeFormat("en-UG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.updated_at))}</p></div><StatusBadge status={record.status} /></div>
      {structured ? <div className="p-6"><p className="text-sm text-muted-foreground">Content is edited in the page sections above. The page route and title are fixed to preserve navigation.</p><Link href={backHref} className="mt-4 inline-flex border border-brand-800 px-4 py-3 text-sm font-bold text-brand-800">Back to pages</Link></div> : <form action={saveAction} className="space-y-5 p-6">
        <div><label htmlFor="title" className="text-sm font-bold">Title</label><input id="title" name="title" defaultValue={record.title} required maxLength={200} disabled={!canEdit} className="mt-2 min-h-12 w-full border bg-white px-3 disabled:bg-background-warm" /></div>
        <div><label htmlFor="slug" className="text-sm font-bold">Slug</label><input id="slug" name="slug" defaultValue={record.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" disabled={!canEdit} className="mt-2 min-h-12 w-full border bg-white px-3 disabled:bg-background-warm" /></div>
        {children}
        <RichTextEditor initialValue={initialHtml} disabled={!canEdit} />
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5"><Link href={backHref} className="inline-flex min-h-11 items-center border border-brand-800 px-5 py-3 text-sm font-bold text-brand-800 hover:bg-background-warm">Back to {entity === "PAGE" ? "pages" : entity === "NEWS_ARTICLE" ? "news" : "events"}</Link>{canEdit ? <SubmitButton>Save changes</SubmitButton> : <span className="text-sm text-muted-foreground">Read-only in this state or for your role.</span>}</div>
      </form>}
    </section>
    <aside className="space-y-6">
      <section className="border bg-white p-6"><h2 className="font-heading text-lg font-bold text-brand-900">Publication workflow</h2><p className="mt-2 text-sm text-muted-foreground">Draft → In review → Approved → Published. Approval and publication require an independent reviewer; the author cannot approve their own work.</p><div className="mt-5 grid gap-3">
        {canSubmit && <form action={transition.bind(null, "IN_REVIEW")}><SubmitButton className="w-full bg-brand-800 px-4 py-3 text-sm font-bold text-white">Submit for review</SubmitButton></form>}
        {record.status === "IN_REVIEW" && !canReview && <p role="status" className="border-l-4 border-accent-gold bg-background-warm p-3 text-sm">Awaiting review by another authorized staff member. Once approved, an independent reviewer can publish this content.</p>}{canReturnToDraft && <form action={transition.bind(null, "DRAFT")}><SubmitButton className="w-full border border-brand-800 px-4 py-3 text-sm font-bold text-brand-800">Withdraw submission to draft</SubmitButton></form>}
        {record.status === "APPROVED" && !canPublish && <p className="border-l-4 border-accent-gold bg-background-warm p-3 text-sm">Approved. Awaiting publication by an authorized independent reviewer.</p>}{canPublish && <form action={transition.bind(null, "PUBLISHED")}><SubmitButton className="w-full bg-brand-800 px-4 py-3 text-sm font-bold text-white">Publish approved content</SubmitButton></form>}
        {canArchive && <form action={transition.bind(null, "ARCHIVED")}><SubmitButton className="w-full border border-brand-800 px-4 py-3 text-sm font-bold text-brand-800">Archive content</SubmitButton></form>}
        {!canSubmit && !canReturnToDraft && !canPublish && !canArchive && <p className="text-sm text-muted-foreground">No lifecycle action is currently available to this account.</p>}
      </div></section>
      {canReview && <section className="border border-accent-gold bg-white p-6"><h2 className="font-heading text-lg font-bold text-brand-900">Review submitted content</h2><p className="mt-2 text-sm text-muted-foreground">Approve to unlock publication, or request revisions. Only a reviewer who is not the author may approve.</p><form action={review} className="mt-5 space-y-4"><FormSelect name="decision" label="Decision" defaultValue="APPROVED" options={[{ value: "APPROVED", label: "Approve" }, { value: "REJECTED", label: "Request revision" }]} /><div><label htmlFor="notes" className="text-sm font-bold">Review notes</label><textarea id="notes" name="notes" maxLength={2000} rows={4} className="mt-2 w-full border p-3" /></div><SubmitButton className="w-full bg-accent-gold px-4 py-3 text-sm font-bold text-brand-900">Record review</SubmitButton></form></section>}
      <section className="border bg-white"><div className="border-b px-6 py-5"><h2 className="font-heading text-lg font-bold text-brand-900">Revision history</h2></div>{revisions.length ? <ol className="divide-y">{revisions.map((revision) => <li key={revision.id} className="px-6 py-4"><p className="text-sm font-bold">Revision {revision.revision_number}</p><p className="mt-1 text-xs text-muted-foreground">{revision.staff_profiles?.display_name ?? "Staff member"} · {new Intl.DateTimeFormat("en-UG", { dateStyle: "medium" }).format(new Date(revision.created_at))}</p>{revision.content_reviews.map((item) => <div key={item.id} className="mt-3 border-l-2 border-accent-gold pl-3 text-xs"><strong>{item.decision}</strong> by {item.staff_profiles?.display_name ?? "Reviewer"}{item.notes && <p className="mt-1 text-muted-foreground">{item.notes}</p>}</div>)}</li>)}</ol> : <p className="px-6 py-8 text-sm text-muted-foreground">No submitted revisions yet.</p>}</section>
    </aside>
  </div>;
}
