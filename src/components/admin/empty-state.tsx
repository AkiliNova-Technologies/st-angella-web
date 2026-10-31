import type { ReactNode } from "react";
export function AdminEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="border border-dashed bg-white px-6 py-12 text-center"><h2 className="font-heading text-xl font-bold text-brand-900">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>{action && <div className="mt-6">{action}</div>}</div>;
}
