"use client";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";
export function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
 return <CheckboxPrimitive.Root data-slot="checkbox" className={cn("peer relative flex size-4 shrink-0 items-center justify-center border border-input outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",className)} {...props}>
  <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center text-current [&>svg]:size-3.5"><CheckIcon /></CheckboxPrimitive.Indicator>
 </CheckboxPrimitive.Root>;
}
