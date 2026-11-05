"use client";
import { useState } from "react";
type Item={id:string;title:string;description:string};
export function SectionItemsEditor({initial,disabled}:{initial:Item[];disabled:boolean}) {
 const [items,setItems]=useState(initial);
 const update=(index:number,patch:Partial<Item>)=>setItems(current=>current.map((item,i)=>i===index?{...item,...patch}:item));
 const move=(index:number,offset:number)=>setItems(current=>{const next=[...current];const target=index+offset;if(target<0||target>=next.length)return current;[next[index],next[target]]=[next[target],next[index]];return next;});
 return <div className="space-y-3"><h4 className="text-sm font-bold">Section items</h4><input type="hidden" name="items" value={JSON.stringify(items)}/>
 {items.map((item,index)=><div key={item.id} className="space-y-3 border p-3">
 <div className="flex items-center justify-between gap-2"><strong className="text-sm">Item {index+1}</strong><div className="flex gap-2"><button type="button" disabled={disabled||index===0} onClick={()=>move(index,-1)} className="border px-3 py-1 text-xs disabled:opacity-40">Up</button><button type="button" disabled={disabled||index===items.length-1} onClick={()=>move(index,1)} className="border px-3 py-1 text-xs disabled:opacity-40">Down</button><button type="button" disabled={disabled} onClick={()=>setItems(current=>current.filter(entry=>entry.id!==item.id))} className="border px-3 py-1 text-xs disabled:opacity-40">Remove</button></div></div>
 <label className="block text-sm">Title<input value={item.title} onChange={event=>update(index,{title:event.target.value})} maxLength={200} disabled={disabled} className="mt-1 block min-h-11 w-full border px-3"/></label>
 <label className="block text-sm">Description<textarea value={item.description} onChange={event=>update(index,{description:event.target.value})} maxLength={2000} rows={3} disabled={disabled} className="mt-1 block w-full border p-3"/></label></div>)}
 <button type="button" disabled={disabled||items.length>=40} onClick={()=>setItems(current=>[...current,{id:crypto.randomUUID(),title:"",description:""}])} className="border border-brand-800 px-4 py-2 text-sm font-bold text-brand-800 disabled:opacity-40">Add item</button></div>;
}
