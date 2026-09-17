"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export async function signIn(formData: FormData) {
  if (!hasSupabaseConfig()) redirect("/login?error=Supabase+is+not+configured.+Ask+the+administrator+to+add+the+project+URL+and+publishable+key.");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}
export async function signUp(formData: FormData) {
  if (!hasSupabaseConfig()) redirect("/login?error=Supabase+is+not+configured.+Ask+the+administrator+to+add+the+project+URL+and+publishable+key.");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Account+created.+Please+sign+in.");
}
