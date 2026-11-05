import { z } from "zod";

export const sectionItemsSchema = z.array(z.object({
 id: z.string().min(1).max(80),
 title: z.string().trim().max(200),
 description: z.string().trim().max(2000),
}).strict()).max(40);

export function parseSectionItems(raw: FormDataEntryValue | null) {
 if (typeof raw !== "string") return null;
 try {
  const result = sectionItemsSchema.safeParse(JSON.parse(raw));
  if (!result.success) return null;
  if (new Set(result.data.map(item => item.id)).size !== result.data.length) return null;
  return result.data;
 } catch {
  return null;
 }
}
