import { AboutHome } from "@/components/home/about-home";
import { Achievements } from "@/components/home/achievements";
import { Hero } from "@/components/home/hero";
import { Highlights } from "@/components/home/highlights";
import { NewsHome } from "@/components/home/news-home";
import { Programmes } from "@/components/home/programmes";
import { AdmissionsCta } from "@/components/sections/admissions-cta";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <>
    <Hero />
    <Highlights />
    <AboutHome />
    <Programmes />
    <Achievements />
    <NewsHome />
    <AdmissionsCta title="Give your child a strong start" description="Visit the admissions page to begin an enquiry. Application steps and requirements will be published only after verification by the school." />
  </>;
}
