import type { ManagedPageSlug } from "./managed-pages";

/** Controls the editing experience, not the public rendering contract. */
export type SectionFieldConfig = {
 image: boolean;
 items: boolean;
 itemSingular: string;
};
const imageSections = new Set([
 "home:hero", "home:introduction", "home:programmes",
 "about:introduction", "about:history", "about:leadership", "about:environment",
 "academics:introduction", "academics:nursery", "academics:primary",
 "admissions:introduction", "school-life:introduction", "school-life:activities",
 "school-life:sports", "school-life:creativity",
]);
const itemSections = new Set([
 "home:highlights", "home:programmes", "home:achievements",
 "about:values", "about:leadership",
 "academics:primary", "academics:approach", "academics:assessment",
 "admissions:process", "admissions:requirements", "admissions:faq",
 "school-life:activities", "school-life:sports", "school-life:creativity", "school-life:wellbeing",
]);
export function sectionFields(page: ManagedPageSlug, section: string): SectionFieldConfig {
 const key = page + ":" + section;
 return {
  image: imageSections.has(key),
  items: itemSections.has(key),
  itemSingular: section === "faq" ? "Question and answer" : section === "values" ? "Value" : section === "achievements" ? "Achievement" : section === "requirements" ? "Requirement" : "Item",
 };
}
