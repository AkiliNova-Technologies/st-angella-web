import type { ContentStatus } from "@/lib/content/lifecycle";

const styles: Record<ContentStatus, string> = {
  DRAFT: "border-slate-300 bg-slate-50 text-slate-700",
  IN_REVIEW: "border-amber-300 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  PUBLISHED: "border-brand-logo/40 bg-background-soft text-brand-900",
  ARCHIVED: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`inline-flex border px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${styles[status]}`}>{status.replace("_", " ")}</span>;
}
