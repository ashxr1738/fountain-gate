import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { AssetQr } from "@/components/asset-qr";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { deleteAsset, requestAsset, returnAsset } from "@/app/(protected)/actions";
import { isAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayDate } from "@/lib/utils";
import type { Asset, EquipmentRequest } from "@/lib/types";

export default async function AssetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const { id } = await params; const { message, error } = await searchParams; const profile = await requireProfile(); const admin = isAdmin(profile); const supabase = await createClient();
  const { data } = await supabase.from("assets").select("*").eq("id", id).single(); if (!data) notFound(); const asset = data as Asset;
  const { data: current } = await supabase.from("requests").select("id,user_id,purpose,requested_from,requested_until,status,users!requests_user_id_fkey(name,email)").eq("asset_id", id).eq("status", "APPROVED").maybeSingle();
  const checkout = current as (EquipmentRequest & { users?: { name: string; email: string } }) | null;
  return <div className="mx-auto max-w-2xl space-y-5">{message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">✓ {message}</p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-church-600">{asset.asset_code}</p><h1 className="text-3xl font-bold">{asset.name}</h1><p className="mt-2 text-slate-600">{asset.category || "Uncategorized"}{asset.description && ` · ${asset.description}`}</p></div><StatusBadge status={asset.status}/></div>
    <Card><h2 className="font-bold">Identification QR</h2><p className="mt-1 text-sm text-slate-600">Scan to open this asset on a phone.</p><div className="mt-3"><AssetQr code={asset.asset_code}/></div></Card>
    {asset.status === "AVAILABLE" && !admin && <Card><h2 className="text-xl font-bold">Request this asset</h2><form action={requestAsset} className="mt-4 space-y-3"><input type="hidden" name="asset_id" value={asset.id}/><label className="block text-sm font-medium">Purpose<textarea required name="purpose" placeholder="Youth service" className="mt-1 min-h-20 w-full rounded-lg border p-3"/></label><label className="block text-sm font-medium">Requested date and time<input required type="datetime-local" name="requested_from" className="mt-1 w-full rounded-lg border p-3"/></label><label className="block text-sm font-medium">Expected return date and time<input required type="datetime-local" name="requested_until" className="mt-1 w-full rounded-lg border p-3"/></label><Button className="w-full">Request Asset</Button></form></Card>}
    {asset.status === "REQUESTED" && <Card><h2 className="font-bold">Awaiting approval</h2><p className="mt-1 text-slate-600">An administrator must approve this request before checkout.</p></Card>}
    {asset.status === "CHECKED_OUT" && checkout && <Card><h2 className="text-xl font-bold">Checked out</h2><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-600">Checked out to</dt><dd className="font-semibold">{checkout.users?.name || "User"}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-600">Expected return</dt><dd className="font-semibold">{displayDate(checkout.requested_until)}</dd></div></dl>{(admin || checkout.user_id === profile.id) && <form action={returnAsset} className="mt-5"><input type="hidden" name="asset_id" value={asset.id}/><Button className="w-full">Return Asset</Button></form>}</Card>}
    {admin && <div className="flex flex-wrap gap-3"><Link href={`/assets/${asset.id}/edit`}><Button variant="outline"><Pencil size={16} className="mr-1"/>Edit</Button></Link><form action={deleteAsset}><input type="hidden" name="id" value={asset.id}/><Button variant="danger"><Trash2 size={16} className="mr-1"/>Remove</Button></form></div>}</div>;
}
