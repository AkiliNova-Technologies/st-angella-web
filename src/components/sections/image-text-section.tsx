import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "./section-heading";
import { cn } from "@/lib/utils";
export function ImageTextSection({ eyebrow, title, description, image, reverse, children }: { eyebrow?: string; title: string; description?: string; image?: { src: string; alt: string }; reverse?: boolean; children?: ReactNode }) { return <section className="py-16 lg:py-24"><Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"><div className={cn("relative min-h-80 bg-background-soft", reverse && "lg:order-2")}>{image ? <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center p-8 text-center font-medium text-brand-800">Approved school photography pending</div>}</div><div><SectionHeading eyebrow={eyebrow} title={title} description={description} />{children && <div className="mt-7">{children}</div>}</div></Container></section>; }
