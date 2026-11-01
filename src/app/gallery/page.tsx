import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
export const instant = false;
import { GalleryBrowser } from "@/components/gallery/gallery-browser";
import { InteriorHero } from "@/components/sections/interior-hero";
import { ContentSection } from "@/components/sections/content-section";
export const metadata: Metadata = { title: "Gallery", description: "Approved school photography from St. Angella School." };
export default async function GalleryPage() { const env = publicEnv(); const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }); const [{ data: images, error }, { data: categories }] = await Promise.all([client.from("media_assets").select("id,alt_text,category_id").eq("kind", "IMAGE").order("created_at", { ascending: false }).limit(120), client.from("media_categories").select("id,name").order("name")]); const used = new Set((images ?? []).map(image => image.category_id)); return <><InteriorHero eyebrow="Gallery" title="Life at St. Angella, documented with care" description="This consent-aware gallery is ready for approved school photography and accessible image descriptions." /><ContentSection eyebrow="School gallery" title="Browse by category" description="Filtering is active; enlargement support will be enabled when approved media is available.">{error ? <p role="status">The gallery is temporarily unavailable.</p> : <GalleryBrowser images={images ?? []} categories={(categories ?? []).filter(category => used.has(category.id))} />}</ContentSection></>; }
