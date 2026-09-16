import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function AssetCodePage({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; const supabase = await createClient(); const { data } = await supabase.from("assets").select("id").eq("asset_code", code.toUpperCase()).single(); redirect(data ? `/assets/${data.id}` : "/assets?error=Asset+not+found"); }
