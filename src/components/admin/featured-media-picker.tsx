"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { uploadEditorImageAction } from "@/app/admin/media/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Asset = { id: string; alt_text: string | null; object_path: string; is_approved: boolean };
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024;

export function FeaturedMediaPicker({ assets, selected, disabled = false }: { assets: Asset[]; selected?: string | null; disabled?: boolean }) {
 const [library, setLibrary] = useState(assets);
 const [choice, setChoice] = useState(selected ?? "");
 const [tab, setTab] = useState<"library" | "upload">("library");
 const [query, setQuery] = useState("");
 const [file, setFile] = useState<File | null>(null);
 const [preview, setPreview] = useState<string | null>(null);
 const [alt, setAlt] = useState("");
 const [pupils, setPupils] = useState("yes");
 const [dragging, setDragging] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");
 const input = useRef<HTMLInputElement>(null);
 useEffect(() => { if (!file) { setPreview(null); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
 function chooseFile(next?: File) {
  setError(""); setSuccess("");
  if (!next) { setFile(null); if (input.current) input.current.value = ""; return; }
  if (!ACCEPT.includes(next.type)) { setError("Choose a JPEG, PNG or WebP image."); return; }
  if (!next.size || next.size > MAX_SIZE) { setError("Image must be between 1 byte and 8 MB."); return; }
  setFile(next);
  if (input.current) { const transfer = new DataTransfer(); transfer.items.add(next); input.current.files = transfer.files; }
 }
 async function upload() {
  if (!file || !alt.trim()) { setError("Select an image and provide alternative text."); return; }
  const data = new FormData(); data.set("file", file); data.set("alt_text", alt.trim()); data.set("contains_pupils", pupils);
  setBusy(true); setError(""); setSuccess("");
  try {
   const result = await uploadEditorImageAction(data);
   if (!result.id || !result.object_path) { setError(result.error ?? "Upload failed."); return; }
   setLibrary(previous => [{ id: result.id!, object_path: result.object_path!, alt_text: result.alt_text ?? null, is_approved: false }, ...previous]);
   setChoice(result.id); chooseFile(); setAlt(""); setSuccess("Image uploaded privately and selected."); setTab("library");
  } catch { setError("Upload failed. Try again."); } finally { setBusy(false); }
 }
 const current = library.find(asset => asset.id === choice);
 const matches = library.filter(asset => (asset.alt_text ?? asset.object_path).toLowerCase().includes(query.toLowerCase()));
 return <section className="space-y-4 border bg-white p-4 sm:p-5" aria-label="Featured image picker">
  <input type="hidden" name="featured_media_id" value={choice} disabled={disabled}/>
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-heading text-base font-bold text-brand-900">Featured image</h3><p className="text-xs text-muted-foreground">Choose an existing image or upload a new one.</p></div>{choice && !disabled && <button type="button" className="border px-3 py-2 text-xs font-semibold" onClick={() => setChoice("")}>Remove image</button>}</div>
  {current && <div className="flex items-center gap-4 border bg-background-warm p-3"><img src={"/admin/media/preview/" + current.id} alt={current.alt_text ?? "Selected featured image"} className="h-24 w-32 object-cover"/><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Selected image</p><p className="mt-1 break-words text-sm">{current.alt_text ?? "Untitled image"}</p><p className="mt-1 text-xs text-muted-foreground">{current.is_approved ? "Approved" : "Private · awaiting approval"}</p></div></div>}
  {!disabled && <div className="flex border-b" role="tablist" aria-label="Image source"><button type="button" role="tab" aria-selected={tab==="library"} onClick={() => setTab("library")} className={"px-4 py-3 text-sm font-semibold " + (tab==="library" ? "border-b-2 border-brand-800 text-brand-900" : "text-muted-foreground")}>Media Library</button><button type="button" role="tab" aria-selected={tab==="upload"} onClick={() => setTab("upload")} className={"px-4 py-3 text-sm font-semibold " + (tab==="upload" ? "border-b-2 border-brand-800 text-brand-900" : "text-muted-foreground")}>Upload new</button></div>}
  {(tab==="library" || disabled) && <div className="space-y-3"><label htmlFor="featured-search" className="sr-only">Search library</label><input id="featured-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search images by description" disabled={disabled} className="min-h-11 w-full border px-3 text-sm"/><div className="grid max-h-80 grid-cols-2 gap-3 overflow-auto sm:grid-cols-3">{matches.map(asset=><button key={asset.id} type="button" disabled={disabled} aria-pressed={choice===asset.id} onClick={()=>setChoice(asset.id)} className={"border p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 " + (choice===asset.id ? "border-brand-800 bg-background-warm" : "hover:border-brand-800")}><img src={"/admin/media/preview/"+asset.id} alt="" loading="lazy" className="aspect-video w-full object-cover"/><span className="mt-2 block truncate text-xs font-semibold">{asset.alt_text ?? "Untitled image"}</span><span className="block text-xs text-muted-foreground">{asset.is_approved ? "Approved" : "Private"}</span></button>)}</div>{matches.length===0 && <p className="border p-5 text-center text-sm text-muted-foreground">No matching images. Try uploading one.</p>}</div>}
  {tab==="upload" && !disabled && <div className="space-y-4"><input ref={input} id="featured-file" type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={event=>chooseFile(event.currentTarget.files?.[0])}/><div role="button" tabIndex={0} aria-label="Choose or drop image" onClick={()=>input.current?.click()} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();input.current?.click();}}} onDragOver={event=>{event.preventDefault();setDragging(true)}} onDragLeave={event=>{event.preventDefault();setDragging(false)}} onDrop={event=>{event.preventDefault();setDragging(false);chooseFile(event.dataTransfer.files[0])}} className={"flex min-h-44 cursor-pointer flex-col items-center justify-center border-2 border-dashed p-5 text-center focus-visible:outline-2 " + (dragging ? "border-brand-800 bg-background-warm" : "border-border hover:border-brand-800")}><UploadCloud className="mb-3 size-9 text-brand-800" aria-hidden="true"/><p className="font-semibold">Drag and drop an image here</p><p className="mt-1 text-sm text-muted-foreground">or click to browse your device</p><p className="mt-2 text-xs text-muted-foreground">JPEG, PNG or WebP · Maximum 8 MB</p></div>{file && <div className="flex items-center gap-3 border p-3">{preview ? <img src={preview} alt="New upload preview" className="size-20 object-cover"/> : <ImagePlus className="size-8"/>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size/1024/1024).toFixed(2)} MB</p></div><button type="button" aria-label="Remove selected file" onClick={()=>chooseFile()} className="border p-2"><X className="size-4"/></button></div>}<div><label htmlFor="featured-alt" className="block text-sm font-semibold">Alternative text</label><input id="featured-alt" value={alt} onChange={event=>setAlt(event.target.value)} maxLength={500} placeholder="Describe what appears in the image" className="mt-2 min-h-11 w-full border px-3"/></div><div><label id="featured-pupils-label" className="block text-sm font-semibold">Contains identifiable pupils?</label><Select value={pupils} onValueChange={value=>setPupils(value??"yes")}><SelectTrigger aria-labelledby="featured-pupils-label" className="mt-2 w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="yes">Yes — keep private pending consent</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div><button type="button" disabled={busy||!file||!alt.trim()} onClick={upload} className="min-h-11 bg-brand-800 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Uploading…" : "Upload and select image"}</button></div>}
  {error && <p role="alert" className="border border-destructive p-3 text-sm text-destructive">{error}</p>}{success && <p role="status" className="border p-3 text-sm text-brand-900">{success}</p>}
  <p className="text-xs text-muted-foreground">Uploads remain private until approved. <Link href="/admin/media" className="font-semibold underline">Manage Media Library</Link></p>
 </section>;
}
