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
    <p className="mb-6 border-l-4 border-accent-gold bg-white p-4 text-sm">Settings are stored as JSON. Public visibility only makes a value eligible for public reads; it does not automatically display it on the school website. Do not store passwords, API keys, or personal information here.</p>
    {params.saved && <p role="status" className="mb-4 border bg-white p-3 text-sm">Setting saved.</p>}
    {(params.error || error) && <p role="alert" className="mb-4 border border-destructive bg-white p-3 text-sm">The setting could not be loaded or saved. Check the JSON and key.</p>}
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]"><section className="space-y-4"><h2 className="font-heading text-xl font-bold text-brand-900">Existing settings</h2>{data?.length ? data.map((item) => <form key={item.id} action={saveSettingAction} className="space-y-3 border bg-white p-5"><input type="hidden" name="id" value={item.id} /><p className="font-bold">{item.key}</p><label htmlFor={`value-${item.id}`} className="block text-sm font-semibold">JSON value</label><textarea id={`value-${item.id}`} name="value" defaultValue={JSON.stringify(item.value, null, 2)} required rows={5} className="w-full border p-3 font-mono text-sm" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" defaultChecked={item.is_public} /> Publicly readable</label><button className="bg-brand-800 px-4 py-2 text-sm font-bold text-white">Save setting</button></form>) : <AdminEmptyState title="No settings configured" description="Add the first verified school setting." />}</section>
    <section><h2 className="mb-4 font-heading text-xl font-bold text-brand-900">Add setting</h2><form action={saveSettingAction} className="space-y-4 border bg-white p-5"><div><label htmlFor="new-key" className="text-sm font-bold">Key</label><input id="new-key" name="key" required maxLength={120} pattern="[a-z][a-z0-9_]*" placeholder="school_motto" className="mt-2 min-h-12 w-full border px-3" /></div><div><label htmlFor="new-value" className="text-sm font-bold">JSON value</label><textarea id="new-value" name="value" defaultValue='""' required rows={6} className="mt-2 w-full border p-3 font-mono text-sm" /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" /> Publicly readable</label><button className="bg-brand-800 px-4 py-3 text-sm font-bold text-white">Add setting</button></form></section></div>
  </AdminShell>;
}
