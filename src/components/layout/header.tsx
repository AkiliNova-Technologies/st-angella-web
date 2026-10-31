"use client";
import Link from "next/link";
import { MapPin, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Container } from "./container";
import { SchoolIdentity } from "./school-identity";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { primaryNavigation } from "@/data/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  return <header className="border-b border-border bg-white">
    <div className="bg-brand-900 text-white"><Container className="flex min-h-9 items-center justify-between gap-4 py-1 text-xs"><p className="flex items-center gap-2"><MapPin className="size-3.5" aria-hidden="true" />Kisaasi, Kampala, Uganda</p><p className="hidden text-white/75 sm:block">Official school website</p></Container></div>
    <Container className="flex min-h-24 items-center justify-between gap-6 py-3"><SchoolIdentity />
      <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary navigation">{primaryNavigation.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={cn("border-b-2 border-transparent py-3 text-sm font-semibold transition-colors hover:border-accent-gold hover:text-brand-800", pathname === item.href && "border-accent-gold text-brand-800")}>{item.label}</Link>)}</nav>
      <div className="hidden xl:block"><Link href="/admissions" className="inline-flex min-h-11 items-center bg-accent-gold px-5 text-sm font-bold text-brand-900 hover:bg-[#b9983e]">Enquire now</Link></div>
      <Sheet><SheetTrigger className="inline-flex size-11 items-center justify-center border border-brand-900 text-brand-900 xl:hidden" aria-label="Open navigation menu"><Menu aria-hidden="true" /></SheetTrigger><SheetContent className="w-[min(24rem,90vw)] bg-white p-0" aria-label="Mobile navigation"><div className="border-b p-5"><SheetTitle className="font-heading text-xl font-bold text-brand-900">Menu</SheetTitle><SheetDescription>Navigate the St. Angella School website.</SheetDescription></div><nav className="flex flex-col" aria-label="Mobile navigation">{primaryNavigation.map((item) => <SheetClose key={item.href} render={<Link href={item.href} className={cn("border-b px-6 py-4 font-semibold hover:bg-background-soft", pathname === item.href && "bg-background-soft text-brand-800")} />}>{item.label}</SheetClose>)}</nav><div className="p-6"><SheetClose render={<Link href="/admissions" className="flex min-h-12 w-full items-center justify-center bg-accent-gold px-5 font-bold text-brand-900" />}>Enquire now</SheetClose></div></SheetContent></Sheet>
    </Container>
  </header>;
}
