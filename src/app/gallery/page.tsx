import type { Metadata } from "next";
import { GalleryBrowser } from "@/components/gallery/gallery-browser";
import { InteriorHero } from "@/components/sections/interior-hero";
import { ContentSection } from "@/components/sections/content-section";
export const metadata: Metadata = { title: "Gallery", description: "Approved school photography from St. Angella School." };
export default function GalleryPage() { return <><InteriorHero eyebrow="Gallery" title="Life at St. Angella, documented with care" description="This consent-aware gallery is ready for approved school photography and accessible image descriptions." /><ContentSection eyebrow="School gallery" title="Browse by category" description="Filtering is active; enlargement support will be enabled when approved media is available."><GalleryBrowser /></ContentSection></>; }
