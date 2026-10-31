"use client";
import { useState } from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";

export function FormCheckbox({ name, label, defaultChecked = false, disabled = false }: { name: string; label: string; defaultChecked?: boolean; disabled?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-foreground"><input type="hidden" name={name} value={checked ? "on" : ""} disabled={disabled} /><CheckboxPrimitive.Root checked={checked} onCheckedChange={next => setChecked(next === true)} disabled={disabled} className="flex size-5 shrink-0 items-center justify-center border border-border bg-white outline-none focus-visible:ring-2 focus-visible:ring-brand-800/30 data-checked:border-brand-800 data-checked:bg-brand-800 data-disabled:opacity-50"><CheckboxPrimitive.Indicator className="text-white"><CheckIcon className="size-4" /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root><span>{label}</span></label>;
}
