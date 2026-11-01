"use client";
import { useState } from "react";
import { createGalleryCategoryAction,renameGalleryCategoryAction,deleteGalleryCategoryAction } from "@/app/admin/gallery/actions";
import { Pencil, Trash2, Plus, X } from "lucide-react";

type Category={id:string;name:string;slug:string};
export function GalleryCategoryManager({categories,canManage}:{categories:Category[];canManage:boolean}) {
 const [adding,setAdding]=useState(false);
 const [editing,setEditing]=useState<string|null>(null);
 const [deleting,setDeleting]=useState<string|null>(null);
 return <section className="mb-8 border bg-white p-5" aria-labelledby="gallery-categories-heading">
  <div className="flex flex-wrap items-start justify-between gap-4">
   <div><h2 id="gallery-categories-heading" className="font-heading text-xl font-bold text-brand-900">Gallery categories <span className="ml-2 text-sm font-normal text-muted-foreground">({categories.length})</span></h2><p className="mt-1 text-sm text-muted-foreground">Organize school photographs by activity or location.</p></div>
   {canManage && <button type="button" onClick={()=>setAdding(v=>!v)} className="flex min-h-10 items-center gap-2 bg-brand-800 px-4 text-sm font-bold text-white"><Plus className="size-4"/>Add category</button>}
  </div>
  {adding && canManage && <form action={createGalleryCategoryAction} className="mt-5 flex flex-wrap gap-2 border bg-background-warm p-4"><label htmlFor="new-gallery-category" className="sr-only">New category name</label><input id="new-gallery-category" name="name" required minLength={2} maxLength={70} placeholder="Category name" className="min-h-11 min-w-48 flex-1 border bg-white px-3 text-sm"/><button className="bg-brand-800 px-4 text-sm font-bold text-white">Create</button><button type="button" onClick={()=>setAdding(false)} className="border px-3 text-sm">Cancel</button></form>}
  <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{categories.map(c=><div key={c.id} className="min-w-0 border p-3">
   <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold" title={c.name}>{c.name}</span>{canManage && <div className="flex shrink-0 gap-1"><button type="button" aria-label={`Edit ${c.name}`} onClick={()=>{setEditing(editing===c.id?null:c.id);setDeleting(null);}} className="border p-2"><Pencil className="size-4"/></button><button type="button" aria-label={`Delete ${c.name}`} onClick={()=>{setDeleting(deleting===c.id?null:c.id);setEditing(null);}} className="border p-2 text-destructive"><Trash2 className="size-4"/></button></div>}</div>
   {editing===c.id && <form action={renameGalleryCategoryAction} className="mt-3 space-y-2 border-t pt-3"><input type="hidden" name="id" value={c.id}/><label htmlFor={`rename-${c.id}`} className="text-xs font-semibold">Category name</label><input id={`rename-${c.id}`} name="name" defaultValue={c.name} required minLength={2} maxLength={70} className="min-h-10 w-full border px-2 text-sm"/><div className="flex gap-2"><button className="bg-brand-800 px-3 py-2 text-xs font-bold text-white">Save changes</button><button type="button" onClick={()=>setEditing(null)} className="border px-3 py-2 text-xs">Cancel</button></div></form>}
   {deleting===c.id && <div className="mt-3 space-y-2 border-t pt-3"><p className="text-xs text-destructive">Delete this category? Categories assigned to images cannot be deleted.</p><form action={deleteGalleryCategoryAction} className="flex gap-2"><input type="hidden" name="id" value={c.id}/><button className="border border-destructive px-3 py-2 text-xs font-bold text-destructive">Confirm delete</button><button type="button" onClick={()=>setDeleting(null)} className="border px-3 py-2 text-xs">Cancel</button></form></div>}
  </div>)}</div>
  {!categories.length && <p className="mt-5 text-sm text-muted-foreground">No categories configured yet.</p>}
 </section>;
}
