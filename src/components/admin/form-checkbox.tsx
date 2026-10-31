"use client";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";


export function FormCheckbox({ name, label, defaultChecked = false, disabled = false }: { name: string; label: string; defaultChecked?: boolean; disabled?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-foreground"><input type="hidden" name={name} value={checked ? "on" : ""} disabled={disabled} /><Checkbox checked={checked} onCheckedChange={next => setChecked(next === true)} disabled={disabled} className="border-brand-800 data-checked:border-brand-800 data-checked:bg-brand-800 data-checked:text-white" /><span>{label}</span></label>;
}
