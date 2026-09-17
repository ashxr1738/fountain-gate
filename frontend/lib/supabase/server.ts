import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabaseConfig } from "./config";

export async function createClient() {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured");
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: (items: Array<{ name: string; value: string; options: any }>) => { try { items.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} } } }
  );
}
