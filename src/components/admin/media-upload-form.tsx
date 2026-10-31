"use client";

import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/admin/submit-button";
import { uploadMediaAction } from "@/app/admin/media/actions";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const LIMIT = 8 * 1024 * 1024;

export function MediaUploadForm({ categories }: { categories: { id: string; name: string }[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("");
  const [pupils, setPupils] = useState("yes");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  function choose(next?: File) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (!next) { setFile(null); setError(""); if (input.current) input.current.value = ""; return; }
    if (!ACCEPT.includes(next.type)) { setFile(null); setError("Select a JPEG, PNG, WebP, or PDF file."); if (input.current) input.current.value = ""; return; }
    if (!next.size || next.size > LIMIT) { setFile(null); setError("The file must be smaller than 8 MB and not empty."); if (input.current) input.current.value = ""; return; }
    setFile(next);
    setError("");
    if (next.type.startsWith("image/")) setPreview(URL.createObjectURL(next));
    // Dropped files must be assigned to the native input so the Server Action receives them.
    if (input.current) {
      const transfer = new DataTransfer();
      transfer.items.add(next);
      input.current.files = transfer.files;
    }
  }

  return <form action={uploadMediaAction} className="mb-7 grid gap-4 border bg-white p-5 sm:grid-cols-2">
    <h2 className="font-heading text-lg font-bold text-brand-900 sm:col-span-2">Upload media</h2>
    <div className="sm:col-span-2">
      <input ref={input} id="media-file" name="file" type="file" accept={ACCEPT.join(",")} required className="sr-only" onChange={event => choose(event.currentTarget.files?.[0])} />
      <div role="button" tabIndex={0} aria-label="Choose or drop a media file" aria-describedby="media-drop-help"
        onClick={() => input.current?.click()}
        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); input.current?.click(); } }}
        onDragOver={event => { event.preventDefault(); setDragging(true); }}
        onDragLeave={event => { event.preventDefault(); setDragging(false); }}
        onDrop={event => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }}
        className={`flex min-h-44 cursor-pointer flex-col items-center justify-center border-2 border-dashed px-5 py-7 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800 ${dragging ? "border-brand-800 bg-background-soft" : "border-border hover:border-brand-800 hover:bg-background-warm"}`}>
        <UploadCloud aria-hidden="true" className="mb-3 size-9 text-brand-800" />
        <p className="font-semibold text-brand-900">Drag and drop an image or PDF here</p>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse your device</p>
        <p id="media-drop-help" className="mt-3 text-xs text-muted-foreground">JPEG, PNG, WebP, PDF · Maximum 8 MB · One file per upload</p>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      {file && <div className="mt-3 flex items-center gap-3 border bg-background-warm p-3">
        {preview ? <img src={preview} alt="Selected upload preview" className="size-16 object-cover" /> : file.type === "application/pdf" ? <FileText aria-hidden="true" className="size-8 text-brand-800" /> : <ImageIcon aria-hidden="true" className="size-8 text-brand-800" />}
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</p></div>
        <button type="button" aria-label="Remove selected file" onClick={() => choose()} className="border p-2 hover:bg-white"><X aria-hidden="true" className="size-4" /></button>
      </div>}
    </div>
    <div><label id="category-label" className="mb-2 block text-sm font-bold">Category</label><input type="hidden" name="category_id" value={category} /><Select value={category} onValueChange={v => setCategory(v ?? "")}><SelectTrigger aria-labelledby="category-label"><SelectValue placeholder="Uncategorized" /></SelectTrigger><SelectContent><SelectItem value="">Uncategorized</SelectItem>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
    <div><label id="pupils-label" className="mb-2 block text-sm font-bold">Does this contain identifiable pupils?</label><input type="hidden" name="contains_pupils" value={pupils} /><Select value={pupils} onValueChange={v => setPupils(v ?? "yes")}><SelectTrigger aria-labelledby="pupils-label"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes — keep private pending consent</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>
    <div className="sm:col-span-2"><label htmlFor="media-alt" className="block text-sm font-bold">Alternative text</label><input id="media-alt" name="alt_text" maxLength={500} className="mt-2 min-h-11 w-full border px-3 text-sm" placeholder="Describe the image for accessibility" /></div>
    <div className="sm:col-span-2"><SubmitButton className="bg-brand-800 px-5 py-3 text-sm font-bold text-white">Upload privately</SubmitButton></div>
  </form>;
}
