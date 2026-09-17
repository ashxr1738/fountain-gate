import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { ClipboardList, Package } from "lucide-react";

type Asset = { id: string; name: string; asset_code: string; status: string };
type Request = { id: string; purpose: string; requested_from: string; requested_until: string; status: string; assets?: { name: string; asset_code: string } | null };

type UserDashboardProps = { session: Session; onBrowse: () => void };
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const formatDate = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function UserDashboard({ session, onBrowse }: UserDashboardProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [assetId, setAssetId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [requestedFrom, setRequestedFrom] = useState("");
  const [requestedUntil, setRequestedUntil] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!supabaseUrl || !supabaseKey) return;
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${session.access_token}` };
    const [assetResponse, requestResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/assets?select=id,name,asset_code,status&status=eq.AVAILABLE&order=name`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/requests?select=id,purpose,requested_from,requested_until,status,assets(name,asset_code)&status=eq.PENDING&order=created_at.desc`, { headers }),
    ]);
    if (assetResponse.ok) setAssets(await assetResponse.json());
    if (requestResponse.ok) setRequests(await requestResponse.json());
  }

  useEffect(() => { void load(); }, [session.access_token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/requests`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ assetId, purpose, requestedFrom, requestedUntil }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(body.error || "The request could not be submitted."); return; }
    setMessage("Request submitted for approval."); setAssetId(""); setPurpose(""); setRequestedFrom(""); setRequestedUntil(""); void load();
  }

  return <div className="space-y-6"><div className="page-header"><div><p className="eyebrow">MY EQUIPMENT</p><h1>Borrow dashboard</h1><p className="muted">Request available equipment and track approval.</p></div><button onClick={onBrowse}><Package size={16}/> Browse assets</button></div>{message && <p className="success">{message}</p>}{error && <p className="alert">{error}</p>}<div className="user-dashboard-grid"><section className="panel"><div className="panel-heading"><div><h2>Request equipment</h2><p className="muted">Choose an available asset and schedule its use.</p></div><ClipboardList size={20}/></div><form className="request-form user-request-form" onSubmit={submit}><label>Equipment<select required value={assetId} onChange={event => setAssetId(event.target.value)}><option value="">Select available equipment</option>{assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name} ({asset.asset_code})</option>)}</select></label><label>Purpose<textarea required value={purpose} onChange={event => setPurpose(event.target.value)} placeholder="Sunday service"/></label><label>Start time<input required type="datetime-local" value={requestedFrom} onChange={event => setRequestedFrom(event.target.value)}/></label><label>Return time<input required type="datetime-local" value={requestedUntil} onChange={event => setRequestedUntil(event.target.value)}/></label><button disabled={busy}>{busy ? "Submitting..." : "Submit request"}</button></form></section><section className="panel"><div className="panel-heading"><div><h2>Pending approval</h2><p className="muted">Requests waiting for an administrator.</p></div><span className="status pending">{requests.length}</span></div>{requests.length === 0 ? <p className="empty">No requests are waiting for approval.</p> : <div className="request-list">{requests.map(request => <article className="request-card" key={request.id}><strong>{request.assets?.name || "Equipment"}</strong><p className="muted">{request.assets?.asset_code} · {request.purpose}</p><p className="muted">{formatDate(request.requested_from)} to {formatDate(request.requested_until)}</p><span className="status pending">PENDING</span></article>)}</div>}</section></div></div>;
}
