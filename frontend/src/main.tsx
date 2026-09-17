import { createClient, type Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { LogOut, PackageSearch, RefreshCw } from "lucide-react";
import "./globals.css";

type Asset = { id: string; name: string; asset_code: string; status: string; category?: string | null };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function Login({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
    setBusy(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) return setError(signInError.message);
    if (data.session) onSignedIn(data.session);
  }

  return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">CHURCH EQUIPMENT</p><h1>Welcome back</h1><p className="muted">Request and return church equipment.</p>{error && <p className="alert">{error}</p>}<form onSubmit={submit}><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button></form></section></main>;
}

function Dashboard({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAssets() {
    if (!supabase) return;
    setLoading(true);
    const { data, error: assetsError } = await supabase.from("assets").select("id,name,asset_code,status,category").order("name");
    setLoading(false);
    if (assetsError) setError(assetsError.message); else setAssets(data ?? []);
  }

  useEffect(() => { void loadAssets(); }, []);
  const available = assets.filter((asset) => asset.status === "AVAILABLE").length;

  return <div className="app-shell"><header><div className="brand"><PackageSearch size={24} /><span>Church Equipment</span></div><div className="header-actions"><span className="user-email">{session.user.email}</span><button className="icon-button" title="Refresh assets" onClick={() => void loadAssets()}><RefreshCw size={18} /></button><button className="secondary" onClick={onSignOut}><LogOut size={16} /> Sign out</button></div></header><main className="content"><div className="intro"><div><p className="eyebrow">EQUIPMENT DESK</p><h1>Available equipment</h1><p className="muted">Browse the church inventory and request what you need.</p></div><div className="stat"><strong>{available}</strong><span>available now</span></div></div>{error && <p className="alert">{error}</p>}{loading ? <p className="empty">Loading equipment...</p> : assets.length === 0 ? <p className="empty">No equipment has been added yet.</p> : <div className="asset-grid">{assets.map((asset) => <article className="asset-card" key={asset.id}><div><span className={`status ${asset.status.toLowerCase()}`}>{asset.status.replace("_", " ")}</span><h2>{asset.name}</h2><p className="muted">{asset.category || "General equipment"}</p></div><code>{asset.asset_code}</code></article>)}</div>}</main></div>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { if (!supabase) return; supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession)); return () => data.subscription.unsubscribe(); }, []);
  if (!session) return <Login onSignedIn={setSession} />;
  return <Dashboard session={session} onSignOut={() => { void supabase?.auth.signOut(); setSession(null); }} />;
}

export default App;
