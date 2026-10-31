import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "St. Angella Nursery & Primary School", template: "%s | St. Angella School" },
  description: "Official website of St. Angella Nursery & Primary School in Kisaasi, Kampala.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={cn(inter.variable, jakarta.variable)}><body className="flex min-h-dvh flex-col antialiased">
    <a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 bg-accent-gold px-4 py-3 font-semibold text-brand-900 focus:translate-y-0">Skip to content</a>
    <Header /><main id="main-content" className="flex-1">{children}</main><Footer />
  </body></html>;
}
