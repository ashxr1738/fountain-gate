import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { isAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Asset } from "@/lib/types";
import { AssetScanner } from "@/components/asset-scanner";

export default async function AssetsPage() { const profile = await requireProfile(); const supabase = await createClient(); const { data } = await supabase.from("assets").select("*").order("name"); const assets = (data || []) as Asset[]; const admin = isAdmin(profile);
return <div className="space-y-5"><div className="flex items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Assets</h1><p className="text-slate-600">Find and request available equipment.</p></div>{admin && <Link href="/assets/new"><Button><Plus size={18} className="mr-1"/>Add Asset</Button></Link>}</div>{!admin && <Card><div className="space-y-3"><div><h2 className="font-bold">Request by QR code</h2><p className="text-sm text-slate-600">Scan an equipment label to open it and submit a request.</p></div><AssetScanner redirectOnScan/></div></Card>}<div className="grid gap-3 sm:grid-cols-2">{assets.map(asset => <Link href={`/assets/${asset.id}`} key={asset.id}><Card className="h-full transition hover:border-church-600"><div className="flex justify-between gap-3"><div><h2 className="font-bold">{asset.name}</h2><p className="mt-1 text-sm text-slate-600">{asset.asset_code} · {asset.category || "Uncategorized"}</p></div><StatusBadge status={asset.status}/></div></Card></Link>)}</div>{assets.length === 0 && <Card className="text-center text-slate-600">No assets yet.{admin && " Add the first item to get started."}</Card>}<p className="flex items-center gap-2 text-sm text-slate-500"><QrCode size={16}/> Scan an asset QR code to open its page.</p></div>; }
