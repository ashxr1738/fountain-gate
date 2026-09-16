import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function currentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("id,name,email,role").eq("id", user.id).single();
  return data as Profile | null;
}
export async function requireProfile() { const profile = await currentProfile(); if (!profile) redirect("/login"); return profile; }
export function isAdmin(profile: Profile) { return profile.role === "ADMIN" || profile.role === "DEVELOPER"; }
