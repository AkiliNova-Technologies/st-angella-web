import type { ReactNode } from "react";
export const instant = false;
export default function AdminLayout({ children }: { children: ReactNode }) { return <div className="min-h-dvh bg-background-warm">{children}</div>; }
