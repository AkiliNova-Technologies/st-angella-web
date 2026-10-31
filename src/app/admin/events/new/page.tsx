import Link from "next/link";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SubmitButton } from "@/components/admin/submit-button";
export const instant = false;
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createEventAction } from "@/app/admin/content-actions";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasPermission } from "@/lib/auth/permissions";
import { EventFields } from "@/components/admin/event-fields";

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
  const { error } = await searchParams;
  return <AdminShell title="Create event" staff={staff} breadcrumbs={[{ label: "Events", href: "/admin/events" }, { label: "New event" }]}>
    <div className="mb-4"><Link href="/admin/events" className="text-sm font-semibold text-brand-800 underline">← Back to listing</Link></div><form action={createEventAction} className="max-w-4xl space-y-5 border bg-white p-6 sm:p-8">
      {error && <p role="alert" className="border-l-4 border-destructive p-4 text-sm">The event could not be saved. Check the details and unique slug.</p>}
      <div><label htmlFor="title" className="text-sm font-bold">Title</label><input id="title" name="title" required maxLength={200} className="mt-2 min-h-12 w-full border px-3" /></div>
      <div><label htmlFor="slug" className="text-sm font-bold">Slug</label><input id="slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-2 min-h-12 w-full border px-3" /></div>
      <EventFields />
      <div><label htmlFor="body" className="text-sm font-bold">Content JSON or plain text</label><textarea id="body" name="body" required rows={12} className="mt-2 w-full border p-3 font-mono text-sm" /></div>
      <SubmitButton>Save draft</SubmitButton>
    </form>
  </AdminShell>;
}
