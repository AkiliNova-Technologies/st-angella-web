"use client";
import { useState } from "react";
import { saveSettingAction } from "@/app/admin/settings/actions";
import { SubmitButton } from "@/components/admin/submit-button";
type Setting={id:string;key:string;value:unknown;is_public:boolean};
const labels:Record<string,string>={school_contact:"School contact information",academic_programmes:"Academic programmes",school_motto:"School motto",school_name:"School name",school_address:"School address",office_hours:"Office hours"};
function friendly(key:string){return labels[key]??key.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function editable(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==="object"&&!Array.isArray(value)}
export function FriendlySettingForm({setting}:{setting:Setting}){
 const [value,setValue]=useState(setting.value);
 const [advanced,setAdvanced]=useState(false);
 const object=editable(value);
 const fields=object?Object.entries(value).filter(([,v])=>typeof v==="string"||typeof v==="number"): [];
 const simple=typeof value==="string"||typeof value==="number";
 const canEdit=fields.length>0||simple;
 const update=(key:string,next:string)=>setValue(current=>({...editable(current)?current:{},[key]:next}));
 return <section className="border bg-white p-6"><div className="mb-4"><h3 className="font-heading text-lg font-bold text-brand-900">{friendly(setting.key)}</h3><p className="mt-1 text-sm text-muted-foreground">Update these details and save when ready.</p></div><form action={saveSettingAction} className="space-y-4"><input type="hidden" name="id" value={setting.id}/><input type="hidden" name="value" value={JSON.stringify(value)}/>{simple?<div><label htmlFor={setting.id} className="mb-2 block text-sm font-semibold">{friendly(setting.key)}</label><input id={setting.id} className="min-h-11 w-full border px-3" value={String(value)} onChange={e=>setValue(e.target.value)}/></div>:fields.map(([key,field])=><div key={key}><label htmlFor={setting.id+key} className="mb-2 block text-sm font-semibold">{friendly(key)}</label><input id={setting.id+key} className="min-h-11 w-full border px-3" value={String(field)} onChange={e=>update(key,e.target.value)}/></div>)}{!canEdit&&<p className="text-sm text-muted-foreground">This section contains structured information. Ask the website administrator before changing its technical format.</p>}
 <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" defaultChecked={setting.is_public}/> Allow this information to be used on the public website</label>
 {(!canEdit||advanced)&&<div><label className="mb-2 block text-sm font-semibold">Advanced configuration (JSON)</label><textarea rows={8} className="w-full border p-3 font-mono text-xs" value={JSON.stringify(value,null,2)} onChange={e=>{try{setValue(JSON.parse(e.target.value))}catch{}}}/></div>}
 <div className="flex flex-wrap items-center gap-4"><SubmitButton>Save changes</SubmitButton><button type="button" onClick={()=>setAdvanced(!advanced)} className="text-xs font-semibold text-brand-800 underline">{advanced?"Hide technical details":"Show technical details"}</button></div></form></section>;
}
