import dotenv from "dotenv";
dotenv.config();

export function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}
