import { notFound, redirect } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { isAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Asset } from "@/lib/types";
export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) { if (!isAdmin(await requireProfile())) redirect("/"); const { id } = await params; const supabase = await createClient(); const { data } = await supabase.from("assets").select("*").eq("id", id).single(); if (!data) notFound(); return <div><h1 className="mb-5 text-3xl font-bold">Edit Asset</h1><AssetForm asset={data as Asset}/></div>; }
