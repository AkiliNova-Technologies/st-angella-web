import { z } from "zod";

/** Fixed public routes. These pages are managed as structured sections, not arbitrary routes. */
export const managedPages = {
 home: { title: "Home", path: "/", sections: ["hero", "highlights", "introduction", "programmes", "achievements", "admissions"] },
 about: { title: "About Us", path: "/about", sections: ["introduction", "history", "mission-vision", "values", "leadership", "environment"] },
 academics: { title: "Academics", path: "/academics", sections: ["introduction", "nursery", "primary", "approach", "assessment"] },
 admissions: { title: "Admissions", path: "/admissions", sections: ["introduction", "process", "requirements", "faq", "call-to-action"] },
 "school-life": { title: "School Life", path: "/school-life", sections: ["introduction", "activities", "sports", "creativity", "wellbeing"] },
 gallery: { title: "Gallery", path: "/gallery", sections: ["introduction"] },
 news: { title: "News & Events", path: "/news", sections: ["introduction"] },
 contact: { title: "Contact", path: "/contact", sections: ["introduction", "details", "location"] },
} as const;

export type ManagedPageSlug = keyof typeof managedPages;
export const managedPageSlugs = Object.keys(managedPages) as ManagedPageSlug[];
export function isManagedPageSlug(value: string): value is ManagedPageSlug {
 return Object.prototype.hasOwnProperty.call(managedPages, value);
}
const sectionSchema = z.object({
 id: z.string().min(1).max(80),
 visible: z.boolean(),
 heading: z.string().max(200).default(""),
 description: z.string().max(5000).default(""),
 imageId: z.string().uuid().nullable().default(null),
 items: z.array(z.object({id:z.string().max(80),title:z.string().max(200),description:z.string().max(2000)})).max(40).default([]),
}).strict();
export const structuredPageBodySchema = z.object({
 version: z.literal(1),
 sections: z.array(sectionSchema).max(30),
}).strict();
export type StructuredPageBody = z.infer<typeof structuredPageBodySchema>;
export function validateManagedPageBody(slug: ManagedPageSlug, body: unknown): StructuredPageBody {
 const parsed = structuredPageBodySchema.parse(body);
 const allowed = new Set<string>(managedPages[slug].sections);
 if (parsed.sections.some(section => !allowed.has(section.id))) throw new Error("Unsupported page section");
 if (new Set(parsed.sections.map(section=>section.id)).size !== parsed.sections.length) throw new Error("Duplicate page section");
 return parsed;
}
export function emptyManagedPageBody(slug: ManagedPageSlug): StructuredPageBody {
 return {version:1,sections:managedPages[slug].sections.map(id=>({id,visible:true,heading:"",description:"",imageId:null,items:[]}))};
}
