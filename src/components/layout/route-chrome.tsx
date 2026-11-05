"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <div className="flex-1">{children}</div>;
  }
  return <><Header /><main id="main-content" className="flex-1">{children}</main><Footer /></>;
}
