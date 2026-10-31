import { z } from "zod";

const publicSchema = z.object({ NEXT_PUBLIC_SUPABASE_URL: z.string().url(), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20), NEXT_PUBLIC_SITE_URL: z.string().url() });
export function publicEnv() { const result = publicSchema.safeParse({ NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL }); if (!result.success) throw new Error("Supabase public environment is not configured."); return result.data; }
export function optionalSecretKey() { return z.string().min(20).optional().parse(process.env.SUPABASE_SECRET_KEY); }
