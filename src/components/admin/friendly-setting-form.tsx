"use client";
import { useState } from "react";
import { saveSettingAction } from "@/app/admin/settings/actions";
import { SubmitButton } from "@/components/admin/submit-button";
type Setting={id:string;key:string;value:unknown;is_public:boolean};
const labels:Record<string,string>={school_contact:"School contact information",academic_programmes:"Academic programmes",school_motto:"School motto",school_name:"School name",school_address:"School address",office_hours:"Office hours",email:"Email address",phone:"Telephone number",address:"Physical address",nursery:"Nursery",primary:"Primary school",levels:"Classes",weekday:"Weekday"};
function friendly(key:string){return labels[key]??key.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function record(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==="object"&&!Array.isArray(value)}
function isSimple(value:unknown){return typeof value==="string"||typeof value==="number"}
function EditableField({name,value,onChange}:{name:string;value:unknown;onChange:(value:unknown)=>void}){
 if(isSimple(value))return <label className="block text-sm font-semibold">{friendly(name)}<input className="mt-2 min-h-11 w-full border px-3 font-normal" value={String(value)} onChange={e=>onChange(typeof value==="number"&&e.target.value.trim()!==""?Number(e.target.value):e.target.value)} /></label>;
 if(Array.isArray(value)&&value.every(isSimple))return <div><label className="block text-sm font-semibold">{friendly(name)}</label><p className="mb-2 text-xs text-muted-foreground">Enter one item per line.</p><textarea rows={Math.max(3,Math.min(8,value.length+1))} className="w-full border p-3 text-sm font-normal" value={value.join("\n")} onChange={e=>onChange(e.target.value.split("\n").map(x=>x.trim()).filter(Boolean))}/></div>;
 if(record(value))return <fieldset className="space-y-4 border p-4"><legend className="px-2 font-semibold">{friendly(name)}</legend>{Object.entries(value).map(([key,child])=><EditableField key={key} name={key} value={child} onChange={next=>onChange({...value,[key]:next})}/>)}</fieldset>;
 return <p className="text-sm text-muted-foreground">{friendly(name)} requires technical assistance to edit.</p>;
}
export function FriendlySettingForm({setting}:{setting:Setting}){
 const [value,setValue]=useState<unknown>(setting.value);
 const [advanced,setAdvanced]=useState(false);
 const [draft,setDraft]=useState(JSON.stringify(setting.value,null,2));
 const [jsonError,setJsonError]=useState("");
 const editValue=(next:unknown)=>{setValue(next);setDraft(JSON.stringify(next,null,2));setJsonError("")};
 const valid=isSimple(value)||record(value)||Array.isArray(value);
 return <section className="border bg-white p-6"><div className="mb-4"><h3 className="font-heading text-lg font-bold text-brand-900">{friendly(setting.key)}</h3><p className="mt-1 text-sm text-muted-foreground">Edit the information below, then select Save changes.</p></div><form action={saveSettingAction} className="space-y-4"><input type="hidden" name="id" value={setting.id}/><input type="hidden" name="value" value={JSON.stringify(value)}/>{advanced?<div><label className="mb-2 block text-sm font-semibold" htmlFor={setting.id+"-json"}>Advanced configuration (JSON)</label><textarea id={setting.id+"-json"} rows={10} className="w-full border p-3 font-mono text-xs" value={draft} onChange={e=>{const next=e.target.value;setDraft(next);try{const parsed=JSON.parse(next);if(parsed===null)throw Error("Value cannot be null");setValue(parsed);setJsonError("")}catch{setJsonError("Invalid JSON. Correct the format before saving.")}}}/>{jsonError&&<p role="alert" className="mt-2 text-sm text-red-700">{jsonError}</p>}</div>:<EditableField name={setting.key} value={value} onChange={editValue}/>}
 <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_public" defaultChecked={setting.is_public}/> Allow this information to be used on the public website</label>
 <div className="flex flex-wrap items-center gap-4"><SubmitButton disabled={!valid||!!jsonError}>Save changes</SubmitButton><button type="button" onClick={()=>{setAdvanced(!advanced);setDraft(JSON.stringify(value,null,2));setJsonError("")}} className="text-xs font-semibold text-brand-800 underline">{advanced?"Use simple editor":"Advanced editor"}</button></div></form></section>;
}
