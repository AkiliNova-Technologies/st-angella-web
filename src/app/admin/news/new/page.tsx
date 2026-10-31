import Link from "next/link";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SubmitButton } from "@/components/admin/submit-button";
export const instant = false;
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createNewsAction } from "@/app/admin/content-actions";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasPermission } from "@/lib/auth/permissions";

export default async function NewNewsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const staff = await requireStaff(); if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden"); const { error } = await searchParams;
  return <AdminShell title="Create news article" staff={staff} breadcrumbs={[{ label: "News", href: "/admin/news" }, { label: "New article" }]}><div className="mb-4"><Link href="/admin/news" className="text-sm font-semibold text-brand-800 underline">← Back to listing</Link></div><form action={createNewsAction} className="max-w-4xl space-y-5 border bg-white p-6 sm:p-8">{error && <p role="alert" className="border-l-4 border-destructive bg-background-warm p-4 text-sm">The draft could not be created. Check that the slug is unique and all fields are valid.</p>}<div><label htmlFor="title" className="text-sm font-bold">Title</label><input id="title" name="title" required maxLength={200} className="mt-2 min-h-12 w-full border px-3" /></div><div><label htmlFor="slug" className="text-sm font-bold">Slug</label><input id="slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-2 min-h-12 w-full border px-3" /></div><div><label htmlFor="summary" className="text-sm font-bold">Summary</label><textarea id="summary" name="summary" required minLength={10} maxLength={500} rows={3} className="mt-2 w-full border p-3" /></div><div><label htmlFor="body" className="text-sm font-bold">Content JSON or plain text</label><textarea id="body" name="body" required rows={18} className="mt-2 w-full border p-3 font-mono text-sm" /></div><SubmitButton>Save draft</SubmitButton></form></AdminShell>;
}
