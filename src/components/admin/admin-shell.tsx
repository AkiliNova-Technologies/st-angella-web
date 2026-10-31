"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarDays, FileText, Images, LayoutDashboard, Mail, Newspaper, Settings, Users } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import type { StaffRole } from "@/lib/auth/permissions";

const navigation: { href: string; label: string; icon: typeof LayoutDashboard; enabled: boolean; superOnly?: boolean }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, enabled: true },
  { href: "/admin/pages", label: "Pages", icon: FileText, enabled: true },
  { href: "/admin/news", label: "News", icon: Newspaper, enabled: true },
  { href: "/admin/events", label: "Events", icon: CalendarDays, enabled: true },
  { href: "/admin/media", label: "Media Library", icon: Images, enabled: true },
  { href: "/admin/staff", label: "Staff", icon: Users, enabled: true, superOnly: true },
  { href: "/admin/enquiries", label: "Enquiries", icon: Mail, enabled: true, superOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, enabled: true, superOnly: true },
];

type Props = {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  breadcrumbs?: { label: string; href?: string }[];
  staff: { displayName: string; roles: StaffRole[] };
};

function Navigation({ roles }: { roles: StaffRole[] }) {
  const pathname = usePathname();
  return <nav aria-label="Administration navigation" className="space-y-1">
    {navigation.filter((item) => !item.superOnly || roles.includes("SUPER_ADMIN")).map(({ href, label, icon: Icon, enabled }) => enabled ? (
      <Link key={href} href={href} aria-current={pathname === href || (href !== "/admin" && pathname.startsWith(href + "/")) ? "page" : undefined} className={`flex min-h-11 items-center gap-3 border-l-2 px-4 text-sm font-semibold transition-colors ${pathname === href || (href !== "/admin" && pathname.startsWith(href + "/")) ? "border-accent-gold bg-white/15 text-white" : "border-transparent text-white/80 hover:border-accent-gold hover:bg-white/10 hover:text-white"}`}>
        <Icon className="size-4" aria-hidden="true" />{label}
      </Link>
    ) : (
      <span key={href} aria-disabled="true" className="flex min-h-11 items-center gap-3 px-4 text-sm font-semibold text-white/35">
        <Icon className="size-4" aria-hidden="true" />{label}<span className="ml-auto text-[10px] uppercase tracking-wider">Soon</span>
      </span>
    ))}
  </nav>;
}

export function AdminShell({ children, title, eyebrow = "Administration", breadcrumbs = [], staff }: Props) {
  return <div className="min-h-dvh bg-background-warm lg:grid lg:grid-cols-[17rem_1fr]">
    <aside className="hidden min-h-dvh bg-brand-900 text-white lg:fixed lg:inset-y-0 lg:block lg:w-68">
      <div className="flex items-center gap-3 border-b border-white/15 px-6 py-6">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center border border-white/30 font-heading text-lg font-bold text-white">SA</span>
        <div><p className="font-heading text-sm font-bold">St. Angella</p><p className="text-xs text-white/60">Staff workspace</p></div>
      </div>
      <div className="px-3 py-6"><Navigation roles={staff.roles} /></div>
    </aside>
    <div className="lg:col-start-2">
      <header className="border-b bg-white">
        <div className="flex min-h-18 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none border border-brand-800 px-3 py-2 text-sm font-bold text-brand-800">Menu</summary>
            <div className="absolute left-0 top-12 z-50 w-72 bg-brand-900 p-4 text-white shadow-xl"><Navigation roles={staff.roles} /></div>
          </details>
          <div className="ml-auto flex items-center gap-4 text-right">
            <div><p className="text-sm font-bold text-brand-900">{staff.displayName}</p><p className="text-xs text-muted-foreground">{staff.roles.join(" · ")}</p></div>
            <form action={logoutAction}><button className="border border-brand-800 px-3 py-2 text-xs font-bold text-brand-800 hover:bg-brand-800 hover:text-white">Sign out</button></form>
          </div>
        </div>
      </header>
      <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs font-semibold text-muted-foreground">
            <Link href="/admin" className="hover:text-brand-800">Admin</Link>
            {breadcrumbs.map((item) => <span key={item.label}> <span aria-hidden="true">/</span> {item.href ? <Link href={item.href} className="hover:text-brand-800">{item.label}</Link> : item.label}</span>)}
          </nav>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-800">{eyebrow}</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-brand-900 sm:text-4xl">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  </div>;
}
