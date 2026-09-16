import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { isAdmin, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const profile = await requireProfile(); const supabase = await createClient(); const admin = isAdmin(profile);
  const [{ count: assets }, { count: available }, { count: checked }, { count: pending }, { count: mine }, { data: checkedOut }] = await Promise.all([
    supabase.from("assets").select("*", { count: "exact", head: true }), supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "AVAILABLE"), supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "CHECKED_OUT"), supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "PENDING"), supabase.from("requests").select("*", { count: "exact", head: true }).eq("user_id", profile.id), supabase.from("requests").select("id,asset_id,requested_until,assets(name,asset_code)").eq("user_id", profile.id).eq("status", "APPROVED")
  ]);
  const cards = admin ? [["Assets", assets || 0, "/assets"], ["Available", available || 0, "/assets"], ["Checked Out", checked || 0, "/assets"], ["Pending Requests", pending || 0, "/requests"]] : [["Available Assets", available || 0, "/assets"], ["My Requests", mine || 0, "/my-requests"], ["My Checked-Out Assets", checkedOut?.length || 0, "/my-equipment"]];
  return <div className="space-y-6"><div><p className="text-sm font-semibold text-church-600">WELCOME, {profile.name.toUpperCase()}</p><h1 className="text-3xl font-bold">Equipment dashboard</h1></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([title, value, href]) => <Link href={href as string} key={title as string}><Card><p className="text-sm text-slate-600">{title}</p><p className="mt-1 text-3xl font-bold">{value}</p></Card></Link>)}</div>{!admin && checkedOut && checkedOut.length > 0 && <Card><h2 className="font-bold">Currently with you</h2><div className="mt-3 space-y-2">{checkedOut.map((request: any) => <Link key={request.id} href={`/assets/${request.asset_id}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span>{request.assets?.name}</span><StatusBadge status="CHECKED_OUT"/></Link>)}</div></Card>}</div>;
}
