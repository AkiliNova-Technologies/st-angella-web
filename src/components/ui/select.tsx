"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={cn("p-1", className)} {...props} />;
}
function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" className={cn("flex flex-1 items-center text-left", className)} {...props} />;
}
function SelectTrigger({ className, size = "default", children, ...props }: SelectPrimitive.Trigger.Props & { size?: "sm" | "default" }) {
  return <SelectPrimitive.Trigger data-slot="select-trigger" data-size={size} className={cn("flex w-full items-center justify-between gap-2 border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-brand-800 focus-visible:ring-2 focus-visible:ring-brand-800/20 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground data-[size=default]:min-h-11 data-[size=sm]:min-h-9 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)} {...props}>{children}<SelectPrimitive.Icon render={<ChevronDownIcon className="size-4 text-muted-foreground" />} /></SelectPrimitive.Trigger>;
}
function SelectContent({ className, children, side = "bottom", sideOffset = 4, align = "center", alignOffset = 0, alignItemWithTrigger = true, ...props }: SelectPrimitive.Popup.Props & Pick<SelectPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger">) {
  return <SelectPrimitive.Portal><SelectPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} alignItemWithTrigger={alignItemWithTrigger} className="isolate z-50"><SelectPrimitive.Popup data-slot="select-content" className={cn("relative z-50 max-h-(--available-height) w-(--anchor-width) min-w-40 overflow-y-auto border border-border bg-white text-foreground shadow-md outline-none", className)} {...props}><SelectScrollUpButton /><SelectPrimitive.List>{children}</SelectPrimitive.List><SelectScrollDownButton /></SelectPrimitive.Popup></SelectPrimitive.Positioner></SelectPrimitive.Portal>;
}
function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return <SelectPrimitive.GroupLabel data-slot="select-label" className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />;
}
function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return <SelectPrimitive.Item data-slot="select-item" className={cn("relative flex min-h-10 w-full cursor-default items-center py-2 pl-3 pr-9 text-sm outline-none select-none focus:bg-background-warm focus:text-brand-900 data-disabled:pointer-events-none data-disabled:opacity-50", className)} {...props}><SelectPrimitive.ItemText className="flex flex-1">{children}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator render={<span className="absolute right-3 flex size-4 items-center justify-center"><CheckIcon className="size-4 text-brand-800" /></span>} /></SelectPrimitive.Item>;
}
function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("my-1 h-px bg-border", className)} {...props} />;
}
function SelectScrollUpButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return <SelectPrimitive.ScrollUpArrow data-slot="select-scroll-up-button" className={cn("flex w-full items-center justify-center bg-white py-1", className)} {...props}><ChevronUpIcon className="size-4" /></SelectPrimitive.ScrollUpArrow>;
}
function SelectScrollDownButton({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return <SelectPrimitive.ScrollDownArrow data-slot="select-scroll-down-button" className={cn("flex w-full items-center justify-center bg-white py-1", className)} {...props}><ChevronDownIcon className="size-4" /></SelectPrimitive.ScrollDownArrow>;
}
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue };
