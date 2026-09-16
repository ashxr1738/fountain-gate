import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayDate } from "@/lib/utils";
export default async function MyEquipmentPage() { const profile = await requireProfile(); const supabase = await createClient(); const { data } = await supabase.from("requests").select("id,asset_id,requested_until,assets(name,asset_code)").eq("user_id", profile.id).eq("status", "APPROVED"); return <div className="space-y-5"><div><h1 className="text-3xl font-bold">My Equipment</h1><p className="text-slate-600">Equipment currently checked out to you.</p></div><div className="space-y-3">{(data || []).map((request: any) => <Link href={`/assets/${request.asset_id}`} key={request.id}><Card><div className="flex justify-between"><div><h2 className="font-bold">{request.assets?.name}</h2><p className="mt-1 text-sm text-slate-600">Return by {displayDate(request.requested_until)}</p></div><StatusBadge status="CHECKED_OUT"/></div></Card></Link>)}</div>{!data?.length && <Card className="text-center text-slate-600">No equipment is currently checked out to you.</Card>}</div>; }
