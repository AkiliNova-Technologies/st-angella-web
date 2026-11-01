"use client";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

export type GalleryImage = { id: string; alt_text: string | null; category_id: string | null };
export type GalleryCategory = { id: string; name: string };
export function GalleryBrowser({ images, categories }: { images: GalleryImage[]; categories: GalleryCategory[] }) {
 const [active,setActive] = useState("all");
 const visible = active === "all" ? images : images.filter(image => image.category_id === active);
 return <div>
  <div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery by category">
   {[{id:"all",name:"All"},...categories].map(category=><button key={category.id} type="button" onClick={()=>setActive(category.id)} aria-pressed={active===category.id} className="min-h-11 border border-brand-800 px-4 text-sm font-bold text-brand-800 transition-colors hover:bg-background-soft aria-pressed:bg-brand-800 aria-pressed:text-white">{category.name}</button>)}
  </div>
  {visible.length ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(item=><figure key={item.id} className="border bg-white"><img src={"/media/public/"+item.id} alt={item.alt_text??""} loading="lazy" className="aspect-[4/3] w-full object-cover"/><figcaption className="p-3 text-sm text-muted-foreground">{item.alt_text}</figcaption></figure>)}</div>
   : <div className="mt-8 flex min-h-80 items-center justify-center border bg-background-soft p-8 text-center"><div><ImageIcon className="mx-auto size-10 text-brand-800" aria-hidden="true"/><h2 className="mt-4 font-heading text-xl font-bold text-brand-900">No approved images in this category</h2><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Photographs will appear after approval and any required consent.</p></div></div>}
 </div>;
}
