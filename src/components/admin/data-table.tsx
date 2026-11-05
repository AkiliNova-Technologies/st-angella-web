import Link from "next/link";
import type { ReactNode } from "react";

export type AdminColumn<T> = { key: string; title: string; render: (item: T) => ReactNode; className?: string };
export function AdminDataTable<T extends { id: string }>({ rows, columns, empty, pagination }: { rows: T[]; columns: AdminColumn<T>[]; empty: ReactNode; pagination?: ReactNode }) {
  return <section className="border border-border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-left text-sm"><thead className="bg-background-warm text-xs font-bold uppercase tracking-wide text-muted-foreground"><tr>{columns.map(col => <th key={col.key} scope="col" className={"border-b px-5 py-4 " + (col.className ?? "")}>{col.title}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.length ? rows.map(row => <tr key={row.id} className="transition-colors hover:bg-background-warm/60">{columns.map(col => <td key={col.key} className={"px-5 py-4 align-middle " + (col.className ?? "")}>{col.render(row)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="p-10 text-center text-muted-foreground">{empty}</td></tr>}</tbody></table></div>{pagination}</section>;
}
export function AdminPagination({ basePath, params, page, pageSize, total }: { basePath: string; params: Record<string, string | undefined>; page: number; pageSize: number; total: number }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  function href(next: number) { const query = new URLSearchParams(); for (const [key, value] of Object.entries(params)) if (value) query.set(key, value); query.set("page", String(next)); query.set("pageSize", String(pageSize)); return basePath + "?" + query.toString(); }
  const linkClass = "inline-flex min-h-9 items-center justify-center border border-border bg-white px-3 text-xs font-bold text-brand-900 hover:bg-background-warm";
  return <nav aria-label="Table pagination" className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4 text-sm"><span className="text-muted-foreground">{total === 0 ? "No records" : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}</span><div className="flex items-center gap-2"><span className="mr-2 text-xs text-muted-foreground">Page {page} of {pageCount}</span>{page > 1 ? <Link className={linkClass} href={href(1)}>First</Link> : null}{page > 1 ? <Link className={linkClass} href={href(page - 1)}>Previous</Link> : null}{page < pageCount ? <Link className={linkClass} href={href(page + 1)}>Next</Link> : null}{page < pageCount ? <Link className={linkClass} href={href(pageCount)}>Last</Link> : null}</div></nav>;
}
export function parseTablePagination(params: { page?: string; pageSize?: string }) {
  const size = Number(params.pageSize); const page = Number(params.page);
  const pageSize = [10, 20, 50].includes(size) ? size : 10;
  return { page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 100000) : 1, pageSize };
}
