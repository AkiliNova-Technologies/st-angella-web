"use client";
import { useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import { manageContentDeletionAction } from "@/app/admin/content-actions";
import { SubmitButton } from "@/components/admin/submit-button";
export function ContentRemovalControl({entity,id,title,operation="trash"}:{entity:"PAGE"|"NEWS_ARTICLE"|"SCHOOL_EVENT";id:string;title:string;operation?:"trash"|"restore"}) {
 const [open,setOpen]=useState(false);
 const action=manageContentDeletionAction.bind(null,entity,id,operation);
 return <><button type="button" onClick={()=>setOpen(true)} aria-label={operation==="trash" ? `Move ${title} to Trash` : `Restore ${title}`} title={operation==="trash" ? "Move to Trash" : "Restore"} className="inline-flex size-9 items-center justify-center border text-brand-800 transition-colors hover:bg-background-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800">{operation==="trash" ? <Trash2 className="size-4" aria-hidden="true"/> : <RotateCcw className="size-4" aria-hidden="true"/>}</button>
 {open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div role="alertdialog" aria-modal="true" aria-labelledby="removal-title" aria-describedby="removal-description" className="w-full max-w-md border bg-white p-6 shadow-xl"><h2 id="removal-title" className="text-xl font-bold text-brand-900">{operation==="trash"?"Move to Trash?":"Restore draft?"}</h2><p id="removal-description" className="my-4 break-words text-sm">{title} — {operation==="trash"?"The item will be hidden and recoverable.":"The item will be restored as an unpublished draft."}</p><form action={action} className="flex justify-end gap-3"><button type="button" onClick={()=>setOpen(false)} className="border px-4 py-2">Cancel</button><SubmitButton>{operation==="trash"?"Confirm removal":"Restore"}</SubmitButton></form></div></div>}</>;
}
