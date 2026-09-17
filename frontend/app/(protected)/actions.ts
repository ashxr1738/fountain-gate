"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function fail(path: string, message: string): never { redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`); }

export async function saveAsset(formData: FormData) {
  const profile = await requireProfile(); if (!isAdmin(profile)) fail("/", "Not authorized");
  const id = String(formData.get("id") || "");
  const values = { name: String(formData.get("name") || "").trim(), asset_code: String(formData.get("asset_code") || "").trim().toUpperCase(), category: String(formData.get("category") || "").trim() || null, description: String(formData.get("description") || "").trim() || null };
  if (!values.name || !values.asset_code) fail("/assets/new", "Name and asset code are required");
  const supabase = await createClient();
  const result = id ? await supabase.from("assets").update(values).eq("id", id) : await supabase.from("assets").insert(values);
  if (result.error) fail(id ? `/assets/${id}/edit` : "/assets/new", result.error.message);
  revalidatePath("/assets"); redirect(id ? `/assets/${id}` : "/assets");
}

export async function deleteAsset(formData: FormData) {
  const profile = await requireProfile(); if (!isAdmin(profile)) fail("/", "Not authorized");
  const id = String(formData.get("id")); const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) fail(`/assets/${id}`, "Only assets without requests can be removed.");
  revalidatePath("/assets"); redirect("/assets");
}

export async function requestAsset(formData: FormData) {
  await requireProfile(); const assetId = String(formData.get("asset_id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("request_asset", { p_asset_id: assetId, p_purpose: String(formData.get("purpose") || ""), p_requested_from: String(formData.get("requested_from")), p_requested_until: String(formData.get("requested_until")) });
  if (error) fail(`/assets/${assetId}`, error.message);
  revalidatePath("/"); revalidatePath("/assets"); redirect("/my-requests?message=Request+sent");
}

export async function decideRequest(formData: FormData) {
  const profile = await requireProfile(); if (!isAdmin(profile)) fail("/", "Not authorized");
  const id = String(formData.get("request_id")); const decision = String(formData.get("decision"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_request", { p_request_id: id, p_approve: decision === "approve", p_reason: String(formData.get("reason") || "") || null });
  if (error) fail("/requests", error.message);
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/requests"); redirect(`/requests?message=Request+${decision}d`);
}

export async function returnAsset(formData: FormData) {
  await requireProfile(); const assetId = String(formData.get("asset_id"));
  const supabase = await createClient(); const { error } = await supabase.rpc("return_asset", { p_asset_id: assetId });
  if (error) fail(`/assets/${assetId}`, error.message);
  revalidatePath("/"); revalidatePath("/assets"); revalidatePath("/my-equipment"); redirect(`/assets/${assetId}?message=Asset+returned`);
}
