import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function createAnonClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    throw new Error("Supabase is not configured. Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createAdminClient(): SupabaseClient {
  const { supabaseUrl, supabaseServiceRoleKey, supabaseAnonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    throw new Error("Supabase is not configured.");
  }
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  return createSupabaseClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createUserClient(accessToken: string): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
