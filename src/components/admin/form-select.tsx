"use client";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};
export function FormSelect({
  name,
  options,
  defaultValue,
  label,
  id,
  disabled = false,
  className = "",
}: {
  name: string;
  options: FormSelectOption[];
  defaultValue: string;
  label: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const labelId = (id ?? name) + "-label";
  return (
    <div className={className}>
      <label id={labelId} className="mb-3 block text-sm font-bold">
        {label}
      </label>
      <input type="hidden" name={name} value={value} disabled={disabled} />
      <Select
        value={value}
        onValueChange={(next) => setValue(next ?? "")}
        disabled={disabled}>
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
