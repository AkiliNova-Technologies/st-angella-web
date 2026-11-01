import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const HEADERS = { "Cache-Control": "public, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const BUCKETS = new Set(["school-photography", "news-images", "gallery-images", "brand-assets"]);
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new NextResponse(null,{status:404,headers:HEADERS});
 const env = publicEnv();
 // The anonymous query applies the database's public-media eligibility RLS predicate.
 const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
 const {data:asset,error} = await client.from("media_assets").select("bucket,object_path,mime_type,kind").eq("id",id).eq("kind","IMAGE").maybeSingle();
 if (error || !asset || !BUCKETS.has(asset.bucket) || !TYPES.has(asset.mime_type)) return new NextResponse(null,{status:404,headers:HEADERS});
 try {
  // Storage buckets remain private. The privileged client is used only AFTER the
  // anonymous, consent-aware RLS eligibility check above succeeds.
  const admin = createSupabaseAdminClient();
  const {data:file,error:downloadError} = await admin.storage.from(asset.bucket).download(asset.object_path);
  if(downloadError || !file) return new NextResponse(null,{status:404,headers:HEADERS});
  return new NextResponse(await file.arrayBuffer(),{status:200,headers:{...HEADERS,"Content-Type":asset.mime_type,"Content-Disposition":"inline","Content-Security-Policy":"default-src 'none'; sandbox","X-Frame-Options":"DENY"}});
 } catch { return new NextResponse(null,{status:503,headers:HEADERS}); }
}
