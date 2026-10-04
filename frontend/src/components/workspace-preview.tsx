import { useMemo, useState, useEffect, useCallback, type FormEvent, type ReactNode } from "react";
import {
  Bell,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Laptop,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Package,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import "./workspace-preview.css";

/* ─── DESIGN TOKENS ─── */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

/* ─── SEED DATA ─── */
const catalogSeed: CatalogItem[] = [
  { id: "CAM-2048", name: "Sony FX3 Cinema Camera", category: "Cameras", status: "Available", icon: "camera" },
  { id: "LAP-1042", name: "MacBook Pro 14-inch", category: "Laptops", status: "Available", icon: "laptop" },
  { id: "TOOL-8831", name: "DeWalt Cordless Drill", category: "Tools", status: "Checked out", icon: "tools" },
  { id: "AUD-0094", name: "Shure Wireless Microphone", category: "Audio", status: "Available", icon: "audio" },
  { id: "CAM-3091", name: "Canon EOS R5 Mirrorless", category: "Cameras", status: "Available", icon: "camera" },
  { id: "LAP-2017", name: "Dell XPS 15 Laptop", category: "Laptops", status: "Available", icon: "laptop" },
];

const initialLoans = [
  { id: "LAP-1042", name: "MacBook Pro 14-inch", due: "Due in 2 days", hours: 48 },
  { id: "AUD-0210", name: "Shure SM7B Microphone", due: "Due tomorrow", hours: 18 },
];

const kpis = [
  { label: "Total Assets", value: "248", detail: "+12 this quarter", tone: "indigo" as const },
  { label: "Active Loans", value: "68%", detail: "Within normal range", tone: "emerald" as const },
  { label: "Overdue Equipment", value: "07", detail: "Needs attention", tone: "amber" as const },
  { label: "Maintenance Queue", value: "12", detail: "3 high priority", tone: "rose" as const },
];

const activities: ReadonlyArray<readonly [string, string, string, "Checkout" | "Return"]> = [
  ["Jordan Lee", "CAM-2048", "Today, 10:42 AM", "Checkout"],
  ["Maya Patel", "LAP-1042", "Today, 09:18 AM", "Return"],
  ["Chris Morgan", "AUD-0210", "Yesterday, 04:32 PM", "Checkout"],
  ["Taylor Kim", "TOOL-8831", "Yesterday, 02:06 PM", "Return"],
  ["Priya Sharma", "CAM-3091", "Yesterday, 11:30 AM", "Checkout"],
];

const inventorySeed = [
  { id: "CAM-2048", name: "Sony FX3 Cinema Camera", category: "Cameras", status: "Available" as const, location: "Studio A" },
  { id: "LAP-1042", name: "MacBook Pro 14-inch", category: "Laptops", status: "Checked out" as const, location: "Design team" },
  { id: "TOOL-8831", name: "DeWalt Cordless Drill", category: "Tools", status: "Maintenance" as const, location: "Workshop" },
  { id: "AUD-0094", name: "Shure Wireless Microphone", category: "Audio", status: "Available" as const, location: "Studio B" },
  { id: "CAM-3091", name: "Canon EOS R5 Mirrorless", category: "Cameras", status: "Available" as const, location: "Studio A" },
];

const barChartData = [28, 42, 35, 62, 78, 54, 84, 68, 48, 72, 92, 58];
const categoryData = [
  { label: "Cameras", value: 42, color: "bg-indigo-600" },
  { label: "Laptops", value: 31, color: "bg-indigo-400" },
  { label: "Audio", value: 18, color: "bg-emerald-500" },
  { label: "Tools", value: 9, color: "bg-amber-500" },
];

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  status: string;
  icon: string;
}

type Screen = "login" | "catalog" | "analytics" | "crud";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ROOT — WORKSPACE PREVIEW ENTRY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function WorkspacePreview() {
  const [screen, setScreen] = useState<Screen>("login");

  return (
    <div className="gv-preview" data-preview-root>
      <PreviewRouter active={screen} onChange={setScreen} />
      {screen === "login" && <LoginPage onEnter={() => setScreen("catalog")} />}
      {screen === "catalog" && <CatalogDashboard />}
      {screen === "analytics" && (
        <AdminShell active="analytics">
          <AnalyticsPage />
        </AdminShell>
      )}
      {screen === "crud" && (
        <AdminShell active="crud">
          <AssetManagementPage />
        </AdminShell>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PREVIEW ROUTER — TOP NAV BAR FOR PAGE SWITCHING
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function PreviewRouter({
  active,
  onChange,
}: {
  active: Screen;
  onChange: (screen: Screen) => void;
}) {
  const links: Array<[Screen, string]> = [
    ["login", "1. Login"],
    ["catalog", "2. User Catalog"],
    ["analytics", "3. Admin Analytics"],
    ["crud", "4. Admin CRUD"],
  ];

  return (
    <nav
      className="gv-router-bar"
      aria-label="Preview page navigation"
    >
      <div className="gv-router-inner">
        <span className="gv-router-brand">
          <Package size={17} aria-hidden="true" />
          <span>GearVault UI Preview</span>
        </span>
        <div className="gv-router-links" role="tablist">
          {links.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active === id}
              aria-controls={`panel-${id}`}
              onClick={() => onChange(id)}
              className={`gv-router-tab ${active === id ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE 1 — LOGIN GATEWAY (SPLIT-SCREEN)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function LoginPage({ onEnter }: { onEnter: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="gv-login-split" id="panel-login">
      {/* ── LEFT PANEL: Dark Slate Brand ── */}
      <aside className="gv-login-left" aria-labelledby="gv-brand-heading">
        <div className="gv-login-left-content">
          {/* Logo */}
          <div className="gv-login-logo">
            <span className="gv-login-logo-icon">
              <ShieldCheck size={24} aria-hidden="true" />
            </span>
            <span className="gv-login-logo-text">GearVault</span>
          </div>

          {/* Hero */}
          <div className="gv-login-hero">
            <p className="gv-login-eyebrow">Asset Portal</p>
            <h1 id="gv-brand-heading" className="gv-login-headline">
              One entry point for every piece of gear.
            </h1>
            <p className="gv-login-subtitle">
              Borrowers and admins use the same secure gateway to keep equipment
              moving and accountable.
            </p>
          </div>

          {/* Feature list */}
          <ul className="gv-login-features">
            <li>
              <Check size={18} aria-hidden="true" />
              <span>
                <strong>Borrowers</strong> browse the catalog and request gear checkouts.
              </span>
            </li>
            <li>
              <Check size={18} aria-hidden="true" />
              <span>
                <strong>Admins</strong> add equipment, approve requests, and track returns.
              </span>
            </li>
          </ul>
        </div>
        <p className="gv-login-footer-text">Internal equipment operations</p>
      </aside>

      {/* ── RIGHT PANEL: White Login Form ── */}
      <section
        className="gv-login-right"
        aria-labelledby="gv-login-title"
      >
        <div className="gv-login-form-container">
          {/* Mobile-only brand */}
          <p className="gv-login-mobile-brand">GearVault / Asset Portal</p>

          <p className="gv-login-form-eyebrow">Secure gateway</p>
          <h2 id="gv-login-title" className="gv-login-form-title">
            Welcome Back
          </h2>
          <p className="gv-login-form-subtitle">Sign in to manage inventory.</p>

          {submitted && (
            <p className="gv-notice gv-notice--success" role="status">
              Preview sign-in submitted. Use the page switcher above to explore
              the workspace.
            </p>
          )}

          <form className="gv-login-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="gv-field">
              <label htmlFor="gv-email" className="gv-label">
                Email Address
              </label>
              <input
                id="gv-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="admin@gearvault.io"
                className="gv-input"
              />
            </div>

            {/* Password */}
            <div className="gv-field">
              <div className="gv-label-row">
                <label htmlFor="gv-password" className="gv-label">
                  Password
                </label>
                <button type="button" className="gv-link-btn">
                  Forgot password?
                </button>
              </div>
              <div className="gv-password-wrapper">
                <input
                  id="gv-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="gv-input gv-input--password"
                />
                <button
                  type="button"
                  className="gv-eye-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="gv-btn gv-btn--primary gv-btn--full"
              onClick={onEnter}
            >
              Sign In to Portal
            </button>
          </form>

          <p className="gv-login-help">Need admin access? Contact IT support.</p>
        </div>
      </section>
    </main>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SHARED — WORKSPACE HEADER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function WorkspaceHeader({
  title,
  onMenu,
}: {
  title: string;
  onMenu?: () => void;
}) {
  return (
    <header className="gv-header">
      <div className="gv-header-inner">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenu}
          className="gv-hamburger"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        {/* Logo */}
        <span className="gv-header-logo-icon">
          <ShieldCheck size={19} aria-hidden="true" />
        </span>
        <span className="gv-header-brand">GearVault</span>
        <span className="gv-header-context">/ {title}</span>

        {/* Right actions */}
        <div className="gv-header-actions">
          <button
            type="button"
            className="gv-icon-btn gv-bell"
            aria-label="View notifications"
          >
            <Bell size={19} />
            <span className="gv-bell-dot" aria-label="Unread notification" />
          </button>
          <div className="gv-header-user">
            <span className="gv-avatar">JD</span>
            <span className="gv-user-name">John Doe</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE 2 — USER / BORROWER CATALOG DASHBOARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function CatalogDashboard() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(catalogSeed);
  const [loans, setLoans] = useState(initialLoans);
  const [notice, setNotice] = useState("");

  const requestCheckout = useCallback((id: string) => {
    setCatalog((items) =>
      items.map((item) =>
        item.id === id ? { ...item, status: "Requested" } : item,
      ),
    );
    setNotice("Checkout request sent for administrator approval.");
  }, []);

  const requestReturn = useCallback((id: string) => {
    setLoans((items) => items.filter((item) => item.id !== id));
    setNotice("Return request initiated. An administrator will confirm the handoff.");
  }, []);

  return (
    <>
      <WorkspaceHeader title="Equipment Catalog" />
      <main
        className="gv-catalog-layout"
        id="panel-catalog"
      >
        {/* ── Main catalog grid ── */}
        <section aria-labelledby="catalog-heading">
          <div className="gv-section-header">
            <div>
              <p className="gv-eyebrow">Borrower workspace</p>
              <h1 id="catalog-heading" className="gv-page-title">
                Browse Equipment
              </h1>
              <p className="gv-page-desc">
                Find the right gear and request it for your next project.
              </p>
            </div>
            <button type="button" className="gv-btn gv-btn--outline">
              <Filter size={17} />
              Filter catalog
            </button>
          </div>

          {notice && (
            <p className="gv-notice gv-notice--info" role="status">
              {notice}
            </p>
          )}

          <div className="gv-catalog-grid">
            {catalog.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                onRequest={requestCheckout}
              />
            ))}
          </div>
        </section>

        {/* ── Sidebar: My Active Items ── */}
        <aside
          className="gv-sidebar-pane"
          aria-labelledby="active-items-heading"
        >
          <div className="gv-sidebar-pane-header">
            <div>
              <p className="gv-eyebrow">Your equipment</p>
              <h2 id="active-items-heading" className="gv-sidebar-title">
                My Active Items
              </h2>
            </div>
            <span className="gv-sidebar-icon-badge">
              <Clock3 size={18} />
            </span>
          </div>

          <div className="gv-active-items-list">
            {loans.length === 0 ? (
              <p className="gv-empty-state-small">No active loans right now.</p>
            ) : (
              loans.map((loan) => (
                <ActiveLoanCard
                  key={loan.id}
                  loan={loan}
                  onReturn={requestReturn}
                />
              ))
            )}
          </div>

          <p className="gv-sidebar-note">
            Return requests are reviewed by the equipment team before the item is
            marked available.
          </p>
        </aside>
      </main>
    </>
  );
}

function CatalogCard({
  item,
  onRequest,
}: {
  item: CatalogItem;
  onRequest: (id: string) => void;
}) {
  const isAvailable = item.status === "Available";

  return (
    <article className="gv-catalog-card">
      {/* Image placeholder */}
      <div
        className="gv-card-media"
        role="img"
        aria-label={`${item.name} image placeholder`}
      >
        <AssetIcon type={item.icon} />
      </div>

      {/* Body */}
      <div className="gv-card-body">
        <div className="gv-card-top">
          <div>
            <h2 className="gv-card-name">{item.name}</h2>
            <p className="gv-card-id">{item.id}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <span className="gv-category-chip">{item.category}</span>

        <button
          type="button"
          onClick={() => onRequest(item.id)}
          disabled={!isAvailable}
          className="gv-btn gv-btn--primary gv-btn--full gv-card-cta"
        >
          {isAvailable ? "Request Checkout" : "Request Pending"}
        </button>
      </div>
    </article>
  );
}

function ActiveLoanCard({
  loan,
  onReturn,
}: {
  loan: (typeof initialLoans)[number];
  onReturn: (id: string) => void;
}) {
  const [countdown, setCountdown] = useState(loan.hours * 3600);

  useEffect(() => {
    const timer = setInterval(() => setCountdown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const hrs = Math.floor(countdown / 3600);
  const mins = Math.floor((countdown % 3600) / 60);
  const secs = countdown % 60;

  return (
    <div className="gv-loan-card">
      <div className="gv-loan-card-top">
        <div>
          <p className="gv-loan-name">{loan.name}</p>
          <p className="gv-loan-id">{loan.id}</p>
        </div>
        <span className="gv-badge gv-badge--amber">{loan.due}</span>
      </div>

      {/* Live countdown */}
      <div className="gv-countdown">
        <Clock3 size={14} aria-hidden="true" />
        <span>
          {String(hrs).padStart(2, "0")}:{String(mins).padStart(2, "0")}:
          {String(secs).padStart(2, "0")}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onReturn(loan.id)}
        className="gv-btn gv-btn--amber gv-btn--full"
      >
        <RotateCcw size={16} />
        Initiate Return Request
      </button>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE 3 — ADMIN ANALYTICS DASHBOARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function AdminShell({
  active,
  children,
}: {
  active: "analytics" | "crud";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const navItems: Array<["analytics" | "crud" | "audit", string, typeof LayoutDashboard]> = [
    ["analytics", "Dashboard", LayoutDashboard],
    ["crud", "Inventory Control", Package],
    ["audit", "Log Audits", FileText],
  ];

  return (
    <div
      className="gv-admin-shell"
      id={`panel-${active}`}
    >
      <WorkspaceHeader
        title={active === "analytics" ? "Admin Analytics" : "Asset Management"}
        onMenu={() => setOpen((v) => !v)}
      />
      <div className="gv-admin-body">
        {/* ── Left Sidebar ── */}
        <aside
          className={`gv-admin-sidebar ${open ? "gv-admin-sidebar--open" : ""}`}
          aria-label="Admin navigation"
        >
          <div className="gv-admin-sidebar-head">
            <p className="gv-admin-sidebar-label">Admin workspace</p>
            <button
              type="button"
              className="gv-admin-sidebar-close"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={19} />
            </button>
          </div>

          <nav className="gv-admin-nav">
            {navItems.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                aria-current={active === id ? "page" : undefined}
                className={`gv-admin-nav-item ${active === id ? "active" : ""}`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          <div className="gv-admin-sidebar-footer">
            <p className="gv-admin-sidebar-section-label">Account</p>
            <button type="button" className="gv-admin-nav-item">
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="gv-admin-content">{children}</main>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="gv-analytics-page">
      {/* Header */}
      <PageIntro
        eyebrow="OVERVIEW"
        title="Admin Analytics"
        description="Monitor inventory health and borrowing activity at a glance."
        action={
          <button type="button" className="gv-btn gv-btn--primary">
            <FileText size={17} />
            Export report
          </button>
        }
      />

      {/* KPI Strip */}
      <div className="gv-kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="gv-charts-row">
        <ChartPanel
          title="Peak Borrowing Hours"
          description="Checkouts by hour, last 30 days"
        >
          <BarChart data={barChartData} />
        </ChartPanel>

        <ChartPanel
          title="Popular Categories"
          description="Share of active checkouts"
        >
          <HorizontalBarChart data={categoryData} />
        </ChartPanel>
      </div>

      {/* Activity Ledger */}
      <ActivityTable />
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  tone,
}: (typeof kpis)[number]) {
  const dotColor = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[tone];

  const borderColor = {
    indigo: "gv-kpi--indigo",
    emerald: "gv-kpi--emerald",
    amber: "gv-kpi--amber",
    rose: "gv-kpi--rose",
  }[tone];

  return (
    <div className={`gv-kpi-card ${borderColor}`}>
      <div className="gv-kpi-head">
        <p className="gv-kpi-label">{label}</p>
        <span className={`gv-kpi-dot ${dotColor}`} aria-hidden="true" />
      </div>
      <p className="gv-kpi-value">{value}</p>
      <p className="gv-kpi-detail">{detail}</p>
    </div>
  );
}

function BarChart({ data }: { data: number[] }) {
  return (
    <div className="gv-bar-chart">
      {data.map((height, index) => (
        <div key={index} className="gv-bar-col group">
          <div
            className="gv-bar"
            style={{ height: `${height}%` }}
          >
            <span className="gv-bar-tooltip">{height}</span>
          </div>
          <span className="gv-bar-label">{index + 8}h</span>
        </div>
      ))}
    </div>
  );
}

function HorizontalBarChart({ data }: { data: typeof categoryData }) {
  return (
    <div className="gv-hbar-chart">
      {data.map(({ label, value, color }) => (
        <div key={label} className="gv-hbar-row">
          <div className="gv-hbar-meta">
            <span className="gv-hbar-label">{label}</span>
            <span className="gv-hbar-value">{value}%</span>
          </div>
          <div className="gv-hbar-track">
            <div
              className={`gv-hbar-fill ${color}`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTable() {
  return (
    <section
      className="gv-table-panel"
      aria-labelledby="activity-ledger-title"
    >
      <div className="gv-table-header">
        <div>
          <h2 id="activity-ledger-title" className="gv-table-title">
            Recent Activity
          </h2>
          <p className="gv-table-desc">Latest checkout and return events.</p>
        </div>
        <button type="button" className="gv-btn gv-btn--outline">
          <ClipboardList size={17} />
          View full ledger
        </button>
      </div>

      <div className="gv-table-scroll">
        <table className="gv-table">
          <caption className="sr-only">Recent equipment activity ledger</caption>
          <thead>
            <tr>
              <th>Borrower Name</th>
              <th>Asset ID</th>
              <th>Timestamp</th>
              <th>Action</th>
              <th className="gv-th-right">Override</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(([borrower, asset, timestamp, action]) => (
              <tr key={`${borrower}-${asset}`}>
                <td className="gv-td-bold">{borrower}</td>
                <td className="gv-td-mono">{asset}</td>
                <td className="gv-td-muted">{timestamp}</td>
                <td>
                  <span
                    className={`gv-badge ${
                      action === "Return"
                        ? "gv-badge--emerald"
                        : "gv-badge--indigo"
                    }`}
                  >
                    {action}
                  </span>
                </td>
                <td className="gv-td-right">
                  <button type="button" className="gv-link-btn">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE 4 — ADMIN ASSET MANAGEMENT (CRUD)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function AssetManagementPage() {
  const [assets, setAssets] = useState(inventorySeed);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(inventorySeed[0]?.id ?? "");
  const [notice, setNotice] = useState("");

  const filtered = useMemo(
    () =>
      assets.filter(
        (asset) =>
          (category === "All" || asset.category === category) &&
          `${asset.name} ${asset.id}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [assets, category, query],
  );

  function addAsset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") || "New equipment");
    const serial = String(form.get("serial") || "NEW-0000");
    const cat = String(form.get("category") || "Tools");
    setAssets((current) => [
      {
        id: serial,
        name: title,
        category: cat,
        status: "Available" as const,
        location: "Unassigned",
      },
      ...current,
    ]);
    setNotice(`${title} was added to the inventory preview.`);
    e.currentTarget.reset();
  }

  return (
    <div className="gv-crud-page">
      <PageIntro
        eyebrow="INVENTORY CONTROL"
        title="Manage Assets"
        description="Create, filter, and maintain the equipment catalog."
        action={
          <button type="button" className="gv-btn gv-btn--outline">
            <Settings2 size={17} />
            Import inventory
          </button>
        }
      />

      {notice && (
        <p className="gv-notice gv-notice--success" role="status">
          {notice}
        </p>
      )}

      <div className="gv-crud-split">
        {/* ── Left Pane: Inventory List ── */}
        <section
          className="gv-crud-list-pane"
          aria-labelledby="inventory-list-title"
        >
          <div className="gv-crud-list-head">
            <div>
              <h2 id="inventory-list-title" className="gv-section-title">
                Current Inventory
              </h2>
              <p className="gv-section-desc">{filtered.length} assets shown</p>
            </div>
            <span className="gv-badge gv-badge--emerald">Live</span>
          </div>

          {/* Search */}
          <label className="gv-search-field">
            <span className="sr-only">Search inventory</span>
            <Search
              className="gv-search-icon"
              size={17}
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ID"
              className="gv-input gv-input--search"
            />
          </label>

          {/* Filter pills */}
          <div className="gv-filter-pills">
            {["All", "Laptops", "Cameras", "Tools", "Audio"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCategory(filter)}
                className={`gv-pill ${category === filter ? "active" : ""}`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Asset list */}
          <div className="gv-asset-scroll">
            {filtered.map((asset) => (
              <button
                type="button"
                key={asset.id}
                onClick={() => setSelectedId(asset.id)}
                className={`gv-asset-list-item ${
                  selectedId === asset.id ? "selected" : ""
                }`}
              >
                <span className="gv-asset-list-icon">
                  <Package size={18} aria-hidden="true" />
                </span>
                <span className="gv-asset-list-info">
                  <span className="gv-asset-list-name">{asset.name}</span>
                  <span className="gv-asset-list-meta">
                    {asset.id} · {asset.location}
                  </span>
                </span>
                <StatusBadge status={asset.status} size="sm" />
              </button>
            ))}
          </div>
        </section>

        {/* ── Right Pane: Add New Asset ── */}
        <section
          className="gv-crud-form-pane"
          aria-labelledby="add-asset-title"
        >
          <div className="gv-crud-form-head">
            <div>
              <p className="gv-eyebrow">New record</p>
              <h2 id="add-asset-title" className="gv-section-title gv-section-title--lg">
                Add New Asset
              </h2>
              <p className="gv-section-desc">
                Create a trackable inventory record for new equipment.
              </p>
            </div>
            <span className="gv-crud-form-icon-badge">
              <Plus size={20} aria-hidden="true" />
            </span>
          </div>

          <form className="gv-crud-form" onSubmit={addAsset}>
            <div className="gv-form-row">
              <FormField
                label="Equipment Title"
                name="title"
                placeholder="e.g. Sony FX3 Cinema Camera"
              />
              <FormField
                label="Unique Serial ID"
                name="serial"
                placeholder="e.g. CAM-2049"
              />
            </div>

            <div className="gv-form-row">
              <div className="gv-field">
                <label className="gv-label" htmlFor="gv-crud-category">
                  Category
                </label>
                <select
                  id="gv-crud-category"
                  name="category"
                  defaultValue="Cameras"
                  className="gv-select"
                >
                  <option>Cameras</option>
                  <option>Laptops</option>
                  <option>Tools</option>
                  <option>Audio</option>
                </select>
              </div>
              <div className="gv-field">
                <label className="gv-label" htmlFor="gv-crud-status">
                  Status Flag
                </label>
                <select
                  id="gv-crud-status"
                  name="status"
                  defaultValue="Available"
                  className="gv-select"
                >
                  <option>Available</option>
                  <option>Maintenance</option>
                  <option>Retired</option>
                </select>
              </div>
            </div>

            {/* Upload area */}
            <div className="gv-field">
              <p className="gv-label">Product media</p>
              <label className="gv-upload-zone" tabIndex={0}>
                <Upload size={25} aria-hidden="true" />
                <span className="gv-upload-text">
                  Drop an image here or browse files
                </span>
                <span className="gv-upload-hint">PNG, JPG up to 10MB</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/png,image/jpeg"
                />
              </label>
            </div>

            <div className="gv-form-actions">
              <button type="button" className="gv-btn gv-btn--outline">
                Cancel
              </button>
              <button type="submit" className="gv-btn gv-btn--primary">
                <Plus size={17} />
                Save Asset
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SHARED UTILITY COMPONENTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  let classes = "gv-badge";
  if (size === "sm") classes += " gv-badge--sm";

  switch (status) {
    case "Available":
      classes += " gv-badge--emerald";
      break;
    case "Checked out":
    case "Requested":
      classes += " gv-badge--amber";
      break;
    case "Maintenance":
      classes += " gv-badge--amber";
      break;
    default:
      classes += " gv-badge--slate";
  }

  return <span className={classes}>{status}</span>;
}

function AssetIcon({ type }: { type: string }) {
  const props = { size: 46, strokeWidth: 1.25, "aria-hidden": true as const };
  switch (type) {
    case "laptop":
      return <Laptop {...props} />;
    case "tools":
      return <Wrench {...props} />;
    case "audio":
      return <Mic {...props} />;
    case "camera":
      return <Camera {...props} />;
    default:
      return <Package {...props} />;
  }
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="gv-page-intro">
      <div>
        <p className="gv-eyebrow">{eyebrow}</p>
        <h1 className="gv-page-title">{title}</h1>
        <p className="gv-page-desc">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const id = title.replaceAll(" ", "-").toLowerCase();
  return (
    <section className="gv-chart-panel" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="gv-chart-title">
        {title}
      </h2>
      <p className="gv-chart-desc">{description}</p>
      <div className="gv-chart-body">{children}</div>
    </section>
  );
}

function FormField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <div className="gv-field">
      <label className="gv-label" htmlFor={`gv-${name}`}>
        {label}
      </label>
      <input
        id={`gv-${name}`}
        name={name}
        required
        placeholder={placeholder}
        className="gv-input"
      />
    </div>
  );
}
