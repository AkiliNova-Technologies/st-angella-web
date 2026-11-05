import { sectionFields } from "@/lib/content/section-fields";
import { SectionItemsEditor } from "@/components/admin/section-items-editor";
import { FormSelect } from "@/components/admin/form-select";
import { managedPages, isManagedPageSlug, validateManagedPageBody } from "@/lib/content/managed-pages";
import { saveManagedSectionAction } from "@/app/admin/pages/section-actions";

export function ManagedSections({slug,body,pageId,canEdit,images}:{slug:string;body:unknown;pageId:string;canEdit:boolean;images:{id:string;alt_text:string|null}[]}) {
 if(!isManagedPageSlug(slug)) return null;
 let parsed;
 try {parsed=validateManagedPageBody(slug,body);}
 catch {return <section className="border bg-white p-6"><h2 className="font-heading text-xl font-bold">Page sections</h2><p className="mt-3 text-sm">This page still uses the legacy content format. Its existing content is preserved. Structured editing requires a reviewed migration.</p></section>;}
 return <section className="border bg-white p-6" aria-label="Page sections">
 <h2 className="font-heading text-xl font-bold text-brand-900">Page sections</h2>
 <p className="mt-2 text-sm text-muted-foreground">{managedPages[slug].sections.length} configured sections. Changes are saved only to drafts.</p>
 <div className="mt-5 space-y-3">{parsed.sections.map(section=><details key={section.id} className="border"><summary className="cursor-pointer p-4 font-semibold capitalize">{section.id.replaceAll("-"," ")} <span className="ml-2 text-xs font-normal text-muted-foreground">{section.visible?"Visible":"Hidden"}</span></summary><form action={saveManagedSectionAction.bind(null,pageId,section.id)} className="space-y-4 border-t p-4"><label className="block text-sm font-semibold">Heading<input name="heading" defaultValue={section.heading} maxLength={200} disabled={!canEdit} className="mt-2 block min-h-11 w-full border px-3"/></label><label className="block text-sm font-semibold">Description<textarea name="description" defaultValue={section.description} maxLength={5000} rows={4} disabled={!canEdit} className="mt-2 block w-full border p-3"/></label>{sectionFields(slug, section.id).image && <FormSelect name="imageId" label="Section image (optional)" defaultValue={section.imageId ?? ""} disabled={!canEdit} options={[{value:"",label:"No image"},...images.map(image=>({value:image.id,label:image.alt_text || "Untitled approved image"}))]}/> }{sectionFields(slug, section.id).image && <p className="text-xs text-muted-foreground">Only approved public images without identifiable pupils are available. Upload and approve images in Media Library first.</p>}{sectionFields(slug, section.id).items && <SectionItemsEditor initial={section.items} disabled={!canEdit}/>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible" defaultChecked={section.visible} disabled={!canEdit}/>Show section</label>{canEdit?<button type="submit" className="bg-brand-800 px-4 py-3 text-sm font-bold text-white">Save section</button>:<p className="text-sm text-muted-foreground">Editing is available only for authorized draft owners.</p>}</form></details>)}</div></section>;
}
