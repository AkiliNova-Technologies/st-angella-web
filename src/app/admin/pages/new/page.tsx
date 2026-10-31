export const instant = false;
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { createPageAction } from "@/app/admin/content-actions";
import { requireStaff } from "@/lib/auth/require-staff";
import { hasPermission } from "@/lib/auth/permissions";

export default async function NewPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const staff = await requireStaff();
  if (!hasPermission(staff.roles, "content:edit")) redirect("/admin/forbidden");
  const { error } = await searchParams;
  return <AdminShell title="Create page" staff={staff} breadcrumbs={[{ label: "Pages", href: "/admin/pages" }, { label: "New page" }]}>
    <form action={createPageAction} className="max-w-4xl space-y-5 border bg-white p-6 sm:p-8">
      {error && <p role="alert" className="border-l-4 border-destructive bg-background-warm p-4 text-sm">Unable to create page. Check the fields and use a unique slug.</p>}
      <div><label htmlFor="title" className="text-sm font-bold">Title</label><input id="title" name="title" required maxLength={200} className="mt-2 min-h-12 w-full border px-3" /></div>
      <div><label htmlFor="slug" className="text-sm font-bold">Slug</label><input id="slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={160} className="mt-2 min-h-12 w-full border px-3" /></div>
      <div><label htmlFor="body" className="text-sm font-bold">Content JSON or plain text</label><textarea id="body" name="body" required rows={16} className="mt-2 w-full border p-3 font-mono text-sm" /></div>
      <button className="bg-brand-800 px-5 py-3 text-sm font-bold text-white">Save draft</button>
    </form>
  </AdminShell>;
}
