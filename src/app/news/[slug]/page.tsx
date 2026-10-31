import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { Container } from "@/components/layout/container";

export const dynamic = "force-dynamic";
type ArticlePageProps = { params: Promise<{ slug: string }> };
function publicClient() {
 const env=publicEnv();
 return createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function getArticle(slug:string) {
 const {data,error}=await publicClient().from("news_articles").select("slug,title,summary,body,published_at").eq("slug",slug).eq("status","PUBLISHED").is("deleted_at",null).maybeSingle();
 if(error) { console.error("Public article query failed",error.code); return null; }
 return data;
}
export async function generateMetadata({params}:ArticlePageProps):Promise<Metadata> {
 const {slug}=await params; const article=await getArticle(slug);
 return article?{title:article.title,description:article.summary??undefined}:{title:"Article not found"};
}
function paragraphs(body:unknown):string[] {
 if(Array.isArray(body)) return body.filter((item):item is string=>typeof item==="string");
 if(body && typeof body==="object" && "content" in body) {
  const content=(body as {content?:unknown}).content;
  if(Array.isArray(content)) return content.flatMap(node=>{
   if(!node || typeof node!=="object" || !("content" in node)) return [];
   const spans=(node as {content?:unknown}).content;
   return Array.isArray(spans)?[spans.filter((span):span is {text:string}=>!!span && typeof span==="object" && "text" in span && typeof span.text==="string").map(span=>span.text).join("")].filter(Boolean):[];
  });
 }
 return [];
}
export default async function NewsArticlePage({params}:ArticlePageProps) {
 const {slug}=await params; const article=await getArticle(slug); if(!article) notFound();
 const published=article.published_at?new Date(article.published_at).toLocaleDateString("en-UG",{day:"numeric",month:"long",year:"numeric"}):null;
 return <article className="py-16 lg:py-24"><Container><header className="max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-800">School news {published&&<>· <time dateTime={article.published_at}>{published}</time></>}</p><h1 className="mt-5 font-heading text-4xl font-extrabold text-brand-900 sm:text-5xl">{article.title}</h1>{article.summary&&<p className="mt-5 text-lg text-muted-foreground">{article.summary}</p>}</header><div className="mt-10 max-w-3xl space-y-5 text-foreground">{paragraphs(article.body).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div></Container></article>;
}
