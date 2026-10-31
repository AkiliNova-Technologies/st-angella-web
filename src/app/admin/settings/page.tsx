import { FriendlySettingForm } from "@/components/admin/friendly-setting-form";
import { FormCheckbox } from "@/components/admin/form-checkbox";
import { SubmitButton } from "@/components/admin/submit-button";
export const instant = false;
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState } from "@/components/admin/empty-state";
import { requireStaff } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveSettingAction } from "./actions";

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const staff = await requireStaff(["SUPER_ADMIN"]); const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("school_settings").select("id, key, value, is_public, updated_at").order("key");
  return <AdminShell title="School Settings" staff={staff} breadcrumbs={[{ label: "Settings" }]}>
    <p className="mb-6 border-l-4 border-accent-gold bg-white p-4 text-sm">Update the information families see about the school. Changes are saved here first; the public website displays them only where that information is connected.</p>
    {params.saved && <p role="status" className="mb-4 border bg-white p-3 text-sm">Setting saved.</p>}
    {(params.error || error) && <p role="alert" className="mb-4 border border-destructive bg-white p-3 text-sm">The setting could not be loaded or saved. Check the JSON and key.</p>}
    <div className="space-y-6"><section className="space-y-4"><h2 className="font-heading text-xl font-bold text-brand-900">School information</h2><p className="text-sm text-muted-foreground">Choose a section, update its details, then save. Technical configuration is available separately below.</p>{data?.length ? data.map((item) => <FriendlySettingForm key={item.id} setting={item} />) : <AdminEmptyState title="No settings configured" description="Add the first verified school setting." />}</section>
    <details className="border bg-white p-5"><summary className="cursor-pointer font-heading text-lg font-bold text-brand-900">Advanced settings — for technical administrators</summary><p className="my-4 text-sm text-muted-foreground">Only use this section when instructed by the website administrator. Do not enter passwords or private personal information.</p><form action={saveSettingAction} className="space-y-4 border bg-white p-5"><div><label htmlFor="new-key" className="text-sm font-bold">Key</label><input id="new-key" name="key" required maxLength={120} pattern="[a-z][a-z0-9_]*" placeholder="school_motto" className="mt-2 min-h-12 w-full border px-3" /></div><div><label htmlFor="new-value" className="text-sm font-bold">JSON value</label><textarea id="new-value" name="value" defaultValue='""' required rows={6} className="mt-2 w-full border p-3 font-mono text-sm" /></div><FormCheckbox name="is_public" label="Publicly readable" /><SubmitButton className="bg-brand-800 px-4 py-3 text-sm font-bold text-white">Add setting</SubmitButton></form></details></div>
  </AdminShell>;
}
