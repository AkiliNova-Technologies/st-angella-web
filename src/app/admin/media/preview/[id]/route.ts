import { NextResponse } from "next/server";
import { getStaffContext } from "@/lib/auth/require-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext();
  if (!staff) return new NextResponse(null, { status: 401, headers: NO_STORE });
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return new NextResponse(null, { status: 404, headers: NO_STORE });
  const supabase = await createSupabaseServerClient();
  const { data: asset, error } = await supabase.from("media_assets")
    .select("bucket, object_path, mime_type, kind")
    .eq("id", id).maybeSingle();
  if (error || !asset || asset.kind !== "IMAGE" || !["image/jpeg", "image/png", "image/webp"].includes(asset.mime_type))
    return new NextResponse(null, { status: 404, headers: NO_STORE });
  if (!["school-photography", "news-images", "gallery-images", "brand-assets"].includes(asset.bucket))
    return new NextResponse(null, { status: 404, headers: NO_STORE });
  const { data: file, error: storageError } = await supabase.storage.from(asset.bucket).download(asset.object_path);
  if (storageError || !file) {
    console.error("Private media preview failed", { id, code: storageError?.name, message: storageError?.message });
    return new NextResponse(null, { status: 404, headers: NO_STORE });
  }
  return new NextResponse(await file.arrayBuffer(), {
    status: 200,
    headers: { ...NO_STORE, "Content-Type": asset.mime_type, "Content-Disposition": "inline", "Content-Security-Policy": "default-src 'none'; sandbox", "X-Frame-Options": "DENY" },
  });
}
