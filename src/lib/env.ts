import { z } from "zod";

const publicSchema = z.object({ NEXT_PUBLIC_SUPABASE_URL: z.string().url(), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20), NEXT_PUBLIC_SITE_URL: z.string().url() });
export function publicEnv() { const result = publicSchema.safeParse(process.env); if (!result.success) throw new Error("Supabase public environment is not configured."); return result.data; }
export function optionalSecretKey() { return z.string().min(20).optional().parse(process.env.SUPABASE_SECRET_KEY); }
