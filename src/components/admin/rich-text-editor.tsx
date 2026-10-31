"use client";
import { useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Undo2 } from "lucide-react";
export function RichTextEditor({ name = "body", initialValue = "", disabled = false }: { name?: string; initialValue?: string; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(initialValue);
  const [mode, setMode] = useState<"visual" | "source">("visual");
  function command(action: string, value?: string) {
    ref.current?.focus();
    document.execCommand(action, false, value);
    setHtml(ref.current?.innerHTML ?? "");
  }
  const actions = [{ label: "Bold", icon: Bold, action: "bold" }, { label: "Italic", icon: Italic, action: "italic" }, { label: "Heading", icon: Heading2, action: "formatBlock", value: "h2" }, { label: "Bulleted list", icon: List, action: "insertUnorderedList" }, { label: "Numbered list", icon: ListOrdered, action: "insertOrderedList" }, { label: "Undo", icon: Undo2, action: "undo" }];
  return <div><label className="mb-2 block text-sm font-bold" htmlFor="content-editor">Article content</label><div className="border bg-white"><div className="flex flex-wrap items-center gap-1 border-b p-2">{actions.map(({ label, icon: Icon, action, value }) => <button key={label} type="button" disabled={disabled || mode === "source"} title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => command(action, value)} className="border p-2 text-brand-900 hover:bg-background-warm disabled:opacity-40"><Icon className="size-4" /></button>)}<button type="button" onClick={() => setMode(mode === "visual" ? "source" : "visual")} className="ml-auto border px-3 py-2 text-xs font-semibold">{mode === "visual" ? "HTML" : "Visual"}</button></div>{mode === "visual" ? <div id="content-editor" ref={ref} role="textbox" aria-label="Article content" aria-multiline="true" contentEditable={!disabled} suppressContentEditableWarning onInput={() => setHtml(ref.current?.innerHTML ?? "")} dangerouslySetInnerHTML={{ __html: initialValue }} className="prose min-h-64 max-w-none p-4 text-sm outline-offset-2 focus:outline-2 focus:outline-brand-800" /> : <textarea id="content-editor" value={html} onChange={(event) => setHtml(event.target.value)} disabled={disabled} rows={12} className="w-full p-4 font-mono text-sm" />}</div><input type="hidden" name={name} value={html} /><p className="mt-2 text-xs text-muted-foreground">Use the toolbar to format headings, emphasis and lists. You do not need to write JSON.</p></div>;
}
