import "server-only";
import { createClient } from "@supabase/supabase-js";
import { optionalSecretKey, publicEnv } from "@/lib/env";
export function createSupabaseAdminClient() { const secret = optionalSecretKey(); if (!secret) throw new Error("SUPABASE_SECRET_KEY is required for staff provisioning."); return createClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, secret, { auth: { autoRefreshToken: false, persistSession: false } }); }
