import { managedPages, isManagedPageSlug, emptyManagedPageBody, validateManagedPageBody } from "@/lib/content/managed-pages";
import type { StructuredPageBody } from "@/lib/content/managed-pages";

export function ManagedSections({slug,body}:{slug:string;body:unknown}) {
 if(!isManagedPageSlug(slug)) return null;
 let parsed:StructuredPageBody;
 try { parsed=validateManagedPageBody(slug,body); }
 catch { parsed=emptyManagedPageBody(slug); }
 return <section className="border bg-white p-6" aria-label="Page sections">
  <h2 className="font-heading text-xl font-bold text-brand-900">Page sections</h2>
  <p className="mt-2 text-sm text-muted-foreground">This page contains {managedPages[slug].sections.length} predefined sections. Section editing will be enabled after the structured draft storage and publishing safeguards are connected.</p>
  <div className="mt-5 divide-y border">{parsed.sections.map(section=><div key={section.id} className="flex items-start justify-between gap-4 p-4"><div><h3 className="font-semibold capitalize">{section.id.replaceAll("-"," ")}</h3><p className="mt-1 text-sm text-muted-foreground">{section.heading || "Heading not configured"}</p></div><span className="border px-2 py-1 text-xs">{section.visible?"Visible":"Hidden"}</span></div>)}</div>
 </section>;
}
