import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { Container } from "@/components/layout/container";

type Props = { params: Promise<{ slug: string }> };
function client() {
  const env = publicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function loadEvent(slug: string) {
  const { data, error } = await client().from("school_events")
    .select("slug,title,summary,body,starts_at,ends_at,location,featured_media_id")
    .eq("slug", slug).eq("status", "PUBLISHED").is("deleted_at", null).maybeSingle();
  if (error) return null;
  return data;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  return event ? { title: event.title, description: event.summary ?? undefined } : { title: "Event not found" };
}
export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) notFound();
  const { data: media } = event.featured_media_id
    ? await client().from("media_assets").select("id,alt_text").eq("id", event.featured_media_id).maybeSingle()
    : { data: null };
  const body = event.body && typeof event.body === "object" && "html" in event.body && typeof event.body.html === "string"
    ? event.body.html.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim() : "";
  return <article className="py-16 lg:py-24"><Container><div className="max-w-4xl">
    <p className="text-xs font-bold uppercase tracking-widest text-brand-800">School event</p>
    <h1 className="mt-5 font-heading text-4xl font-extrabold text-brand-900">{event.title}</h1>
    {event.summary && <p className="mt-5 text-lg text-muted-foreground">{event.summary}</p>}
    <dl className="mt-8 space-y-3 border bg-background-warm p-5 text-sm">
      <div><dt className="font-bold">Starts</dt><dd><time dateTime={event.starts_at}>{new Date(event.starts_at).toLocaleString("en-UG", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Kampala" })}</time></dd></div>
      {event.ends_at && <div><dt className="font-bold">Ends</dt><dd><time dateTime={event.ends_at}>{new Date(event.ends_at).toLocaleString("en-UG", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Kampala" })}</time></dd></div>}
      {event.location && <div><dt className="font-bold">Location</dt><dd>{event.location}</dd></div>}
    </dl>
    {media && <img src={"/media/public/" + media.id} alt={media.alt_text ?? ""} className="mt-8 aspect-video w-full object-cover" />}
    {body && <p className="mt-10 whitespace-pre-wrap leading-relaxed">{body}</p>}
  </div></Container></article>;
}
