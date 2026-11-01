import { managedPages, isManagedPageSlug, validateManagedPageBody } from "@/lib/content/managed-pages";
import { saveManagedSectionAction } from "@/app/admin/pages/section-actions";

export function ManagedSections({slug,body,pageId,canEdit}:{slug:string;body:unknown;pageId:string;canEdit:boolean}) {
 if(!isManagedPageSlug(slug)) return null;
 let parsed;
 try {parsed=validateManagedPageBody(slug,body);}
 catch {return <section className="border bg-white p-6"><h2 className="font-heading text-xl font-bold">Page sections</h2><p className="mt-3 text-sm">This page still uses the legacy content format. Its existing content is preserved. Structured editing requires a reviewed migration.</p></section>;}
 return <section className="border bg-white p-6" aria-label="Page sections">
 <h2 className="font-heading text-xl font-bold text-brand-900">Page sections</h2>
 <p className="mt-2 text-sm text-muted-foreground">{managedPages[slug].sections.length} configured sections. Changes are saved only to drafts.</p>
 <div className="mt-5 space-y-3">{parsed.sections.map(section=><details key={section.id} className="border"><summary className="cursor-pointer p-4 font-semibold capitalize">{section.id.replaceAll("-"," ")} <span className="ml-2 text-xs font-normal text-muted-foreground">{section.visible?"Visible":"Hidden"}</span></summary><form action={saveManagedSectionAction.bind(null,pageId,section.id)} className="space-y-4 border-t p-4"><label className="block text-sm font-semibold">Heading<input name="heading" defaultValue={section.heading} maxLength={200} disabled={!canEdit} className="mt-2 block min-h-11 w-full border px-3"/></label><label className="block text-sm font-semibold">Description<textarea name="description" defaultValue={section.description} maxLength={5000} rows={4} disabled={!canEdit} className="mt-2 block w-full border p-3"/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible" defaultChecked={section.visible} disabled={!canEdit}/>Show section</label>{canEdit?<button type="submit" className="bg-brand-800 px-4 py-3 text-sm font-bold text-white">Save section</button>:<p className="text-sm text-muted-foreground">Editing is available only for authorized draft owners.</p>}</form></details>)}</div></section>;
}
