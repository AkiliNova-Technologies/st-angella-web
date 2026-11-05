"use client";
import Link from "next/link";
import { FormSelect } from "@/components/admin/form-select";

type Category = {id:string;name:string};
export function GalleryFilters({categories,search,category,status}:{categories:Category[];search:string;category:string;status:string}) {
 return <form method="get" action="/admin/gallery" className="grid gap-4 border bg-white p-5 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_auto]">
  <div><label htmlFor="gallery-search" className="mb-2 block text-sm font-bold">Search descriptions</label><input id="gallery-search" name="q" defaultValue={search} maxLength={80} placeholder="Search images" className="min-h-11 w-full border px-3 text-sm"/></div>
  <FormSelect name="category" label="Category" defaultValue={category} options={[{value:"",label:"All categories"},{value:"uncategorized",label:"Uncategorized"},...categories.map(c=>({value:c.id,label:c.name}))]}/>
  <FormSelect name="status" label="Publication status" defaultValue={status} options={[{value:"",label:"All statuses"},{value:"pending",label:"Pending approval"},{value:"approved",label:"Approved, private"},{value:"published",label:"Published"}]}/>
  <div className="flex items-end gap-2"><button type="submit" className="min-h-11 bg-brand-800 px-5 text-sm font-bold text-white">Apply</button><Link href="/admin/gallery" className="flex min-h-11 items-center border px-4 text-sm font-semibold">Reset</Link></div>
 </form>;
}
