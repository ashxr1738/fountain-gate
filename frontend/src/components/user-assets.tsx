import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { CalendarClock, Package, Search, X } from "lucide-react";

type Asset = { id: string; name: string; asset_code: string; status: string; category: string | null };

type UserAssetsProps = { session: Session; onScan: () => void };

export function UserAssets({ session, onScan }: UserAssetsProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [purpose, setPurpose] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const response = await fetch(`${url}/rest/v1/assets?select=id,name,asset_code,status,category&order=name`, { headers: { apikey: key, Authorization: `Bearer ${session.access_token}` } });
    if (response.ok) setAssets(await response.json());
  }

  useEffect(() => { void load(); }, [session.access_token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/requests`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ assetId: selected?.id, purpose, requestedFrom: from, requestedUntil: until }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(body.error || "The request could not be queued."); return; }
    setMessage("Request queued. An administrator will review it."); setSelected(null); setPurpose(""); setFrom(""); setUntil("");
  }

  const shown = assets.filter(asset => `${asset.name} ${asset.asset_code} ${asset.category || ""}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="page-header"><div><p className="eyebrow">BORROW EQUIPMENT</p><h1>Available assets</h1><p className="muted">Choose equipment, request a time, and return it when you are done.</p></div><button onClick={onScan}>Scan QR</button></div>{message && <p className="success">{message}</p>}<section className="panel"><div className="toolbar"><div className="search"><Search size={16}/><input placeholder="Search equipment" value={query} onChange={event => setQuery(event.target.value)}/></div></div>{shown.length === 0 ? <p className="empty">No available assets match your search.</p> : <div className="asset-table">{shown.map(asset => <div className="asset-row" key={asset.id}><div className="asset-icon"><Package size={20}/></div><div className="asset-main"><strong>{asset.name}</strong><span>{asset.asset_code} · {asset.category || "Uncategorised"}</span></div><span className={`status ${asset.status.toLowerCase()}`}>{asset.status.replace("_", " ")}</span>{asset.status === "AVAILABLE" && <button onClick={() => setSelected(asset)}>Request</button>}</div>)}</div>}</section>{selected && <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="modal-heading"><div><p className="eyebrow">NEW REQUEST</p><h2>{selected.name}</h2></div><button type="button" className="icon-button" title="Close" onClick={() => setSelected(null)}><X size={18}/></button></div><label>Purpose<textarea required value={purpose} onChange={event => setPurpose(event.target.value)} placeholder="Sunday service"/></label><label><span className="inline-flex items-center gap-2"><CalendarClock size={15}/>Start time</span><input required type="datetime-local" value={from} onChange={event => setFrom(event.target.value)}/></label><label>Return time<input required type="datetime-local" value={until} onChange={event => setUntil(event.target.value)}/></label>{error && <p className="alert">{error}</p>}<button disabled={busy}>{busy ? "Queueing request..." : "Submit request"}</button></form></div>}</>;
}
