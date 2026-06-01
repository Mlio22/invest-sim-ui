'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const PerformanceChart = dynamic(() => import('./PerformanceChart'), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center text-[#4a5c70] text-sm">
      Loading chart...
    </div>
  ),
});

// ─── Types ─────────────────────────────────────────────────────────────────────

// shopspring/decimal serializes as a JSON string, e.g. "1.54"
type Decimal = string;

interface PortfolioSummary {
  total_value: Decimal;
  cash_balance: Decimal;
  invested_value: Decimal;
  total_pnl: Decimal;
  total_pnl_pct: Decimal;
  today_pnl: Decimal;
  today_pnl_pct: Decimal;
}

interface Holding {
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avg_buy_price: Decimal;
  current_price: Decimal;
  market_value: Decimal;
  unrealized_pnl: Decimal;
  unrealized_pnl_pct: Decimal;
  day_change: Decimal;
  day_change_pct: Decimal;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  price: Decimal;
  change: Decimal;
  change_pct: Decimal;
  note?: string;
}

interface MoverItem {
  symbol: string;
  name: string;
  sector: string;
  price: Decimal;
  change: Decimal;
  change_pct: Decimal;
}

interface DashboardData {
  portfolio: PortfolioSummary;
  holdings: Holding[];
  watchlist: WatchlistItem[];
  movers: { gainers: MoverItem[]; losers: MoverItem[] };
  recent_transactions: Array<{
    id: string;
    symbol: string;
    transaction_type: 'BUY' | 'SELL';
    quantity: number;
    price: Decimal;
    total_amount: Decimal;
    status: string;
    created_at: string;
  }>;
}

interface PerformancePoint {
  date: string;
  value: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kapita-token');
}

function decodeEmail(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || payload.sub || 'User';
  } catch {
    return 'User';
  }
}

// Converts a shopspring/decimal string (or plain number) to a JS number.
function toNum(v: Decimal | number): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function formatIDR(value: Decimal | number, compact = false): string {
  const n = toNum(value);
  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
    return `Rp ${n.toFixed(0)}`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(value: Decimal | number): string {
  const n = toNum(value);
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function pnlColor(value: Decimal | number): string {
  const n = toNum(value);
  if (n > 0) return 'text-green-400';
  if (n < 0) return 'text-red-400';
  return 'text-[#94a3b8]';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function IconPortfolio({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#f97316' : 'currentColor'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function IconMarkets({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#f97316' : 'currentColor'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconWallet({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#f97316' : 'currentColor'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" />
      <circle cx="17" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
      active ? 'bg-[#f97316]/10 text-[#f97316]' : 'text-[#94a3b8] hover:bg-[#1e2d4a] hover:text-white'
    }`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Sidebar({ email, onLogout }: { email: string; onLogout: () => void }) {
  const initial = email.charAt(0).toUpperCase();
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#0d1829] border-r border-[#1e2d4a] min-h-screen px-4 py-6">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 bg-[#f97316] rounded-lg flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <span className="text-[#f97316] font-bold text-lg tracking-[0.2em]">KAPITA</span>
      </div>

      <nav className="flex-1 space-y-1">
        <NavItem icon={<IconPortfolio active />} label="Portfolio" active />
        <NavItem icon={<IconMarkets />} label="Markets" />
        <NavItem icon={<IconWallet />} label="Wallet" />
      </nav>

      <div className="space-y-1 mt-4">
        <div className="flex items-center gap-3 px-3 py-2 text-[#94a3b8] text-sm">
          <div className="w-7 h-7 rounded-full bg-[#1e2d4a] flex items-center justify-center text-xs font-semibold text-white">
            {initial}
          </div>
          <span className="truncate flex-1">{email}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[#94a3b8] hover:bg-[#1e2d4a] hover:text-red-400 transition-colors text-sm"
        >
          <IconLogout />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Bottom Nav ─────────────────────────────────────────────────────────

function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d1829] border-t border-[#1e2d4a] flex z-50">
      {[
        { icon: <IconPortfolio active />, label: 'Portfolio', active: true },
        { icon: <IconMarkets />, label: 'Markets' },
        { icon: <IconWallet />, label: 'Wallet' },
      ].map(({ icon, label, active }) => (
        <button key={label} className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] transition-colors ${
          active ? 'text-[#f97316]' : 'text-[#4a5c70]'
        }`}>
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor }: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div className="bg-[#111e35] rounded-xl p-4 border border-[#1e2d4a]">
      <p className="text-[#4a5c70] text-xs mb-1">{label}</p>
      <p className="text-white text-lg font-bold leading-tight">{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${subColor || 'text-[#94a3b8]'}`}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-white font-semibold text-sm">{title}</h2>
      {right}
    </div>
  );
}

function MoverRow({ item }: { item: MoverItem }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-sm font-medium">{item.symbol}</p>
        <p className="text-[#4a5c70] text-xs truncate max-w-35">{item.name}</p>
      </div>
      <div className="text-right">
        <p className="text-white text-sm">{formatIDR(item.price, true)}</p>
        <p className={`text-xs font-medium ${pnlColor(item.change_pct)}`}>{formatPct(item.change_pct)}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

const RANGES = ['1W', '1M', '3M', '1Y', 'ALL'] as const;
type Range = typeof RANGES[number];

export default function DashboardContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [perfData, setPerfData] = useState<PerformancePoint[]>([]);
  const [range, setRange] = useState<Range>('1M');
  const [loading, setLoading] = useState(true);
  const [perfLoading, setPerfLoading] = useState(true);
  const [error, setError] = useState('');

  const logout = useCallback(() => {
    localStorage.removeItem('kapita-token');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setEmail(decodeEmail(token));

    fetch(`${API_URL}/api/v1/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) { logout(); return null; }
        if (!r.ok) throw new Error('Failed to load dashboard');
        return r.json();
      })
      .then((json) => { if (json) setData(json.data as DashboardData); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router, logout]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setPerfLoading(true);
    fetch(`${API_URL}/api/v1/portfolio/performance?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data?.points) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPerfData(json.data.points.map((p: any) => ({
            date: p.date,
            value: parseFloat(p.value),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setPerfLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#4a5c70] text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={logout} className="text-[#f97316] text-sm underline">Log out</button>
        </div>
      </div>
    );
  }

  const p = data?.portfolio;

  return (
    <div className="min-h-screen bg-[#0b1326] flex">
      <Sidebar email={email} onLogout={logout} />

      <div className="flex-1 flex flex-col">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0b1326] border-b border-[#1e2d4a]">
          <div className="w-8 h-8 rounded-full bg-[#1e2d4a] flex items-center justify-center text-white text-xs font-semibold">
            {email.charAt(0).toUpperCase()}
          </div>
          <span className="text-[#f97316] font-bold tracking-[0.2em] text-base">KAPITA</span>
          <button className="text-[#4a5c70]"><IconBell /></button>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a]">
          <h1 className="text-white font-bold text-xl">Portfolio</h1>
          <div className="flex items-center gap-3">
            <button className="text-[#4a5c70] hover:text-white transition-colors"><IconBell /></button>
            <div className="w-8 h-8 rounded-full bg-[#1e2d4a] flex items-center justify-center text-white text-xs font-semibold">
              {email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-20 md:pb-6">
          {/* Hero Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StatCard
              label="Total Value"
              value={p ? formatIDR(p.total_value) : '—'}
              sub={p ? `Cash: ${formatIDR(p.cash_balance, true)}` : undefined}
            />
            <StatCard
              label="Total Return"
              value={p ? formatIDR(p.total_pnl) : '—'}
              sub={p ? formatPct(p.total_pnl_pct) : undefined}
              subColor={p ? pnlColor(p.total_pnl) : undefined}
            />
            <StatCard
              label="Today&apos;s Return"
              value={p ? formatIDR(p.today_pnl) : '—'}
              sub={p ? formatPct(p.today_pnl_pct) : undefined}
              subColor={p ? pnlColor(p.today_pnl) : undefined}
            />
          </div>

          {/* Chart + Watchlist */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 bg-[#111e35] rounded-xl p-4 border border-[#1e2d4a]">
              <SectionHeader title="Portfolio Performance" right={
                <div className="flex gap-1">
                  {RANGES.map((r) => (
                    <button key={r} onClick={() => setRange(r)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        range === r ? 'bg-[#f97316] text-white' : 'text-[#4a5c70] hover:text-white'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              } />
              <PerformanceChart data={perfData} loading={perfLoading} />
            </div>

            <div className="bg-[#111e35] rounded-xl p-4 border border-[#1e2d4a]">
              <SectionHeader title="Watchlist" />
              {!data?.watchlist.length ? (
                <p className="text-[#4a5c70] text-xs py-4 text-center">No items in watchlist yet.</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-52">
                  {data.watchlist.map((w) => (
                    <div key={w.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{w.symbol}</p>
                        <p className="text-[#4a5c70] text-xs truncate max-w-30">{w.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">{formatIDR(w.price, true)}</p>
                        <p className={`text-xs ${pnlColor(w.change_pct)}`}>{formatPct(w.change_pct)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Holdings + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 bg-[#111e35] rounded-xl p-4 border border-[#1e2d4a]">
              <SectionHeader title="Top Holdings" />
              {!data?.holdings.length ? (
                <p className="text-[#4a5c70] text-xs py-4 text-center">
                  No holdings yet. Place your first trade to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#4a5c70] border-b border-[#1e2d4a]">
                        <th className="text-left pb-2 font-medium">ASSET</th>
                        <th className="text-right pb-2 font-medium">QTY</th>
                        <th className="text-right pb-2 font-medium hidden sm:table-cell">AVG PX</th>
                        <th className="text-right pb-2 font-medium">MKT PX</th>
                        <th className="text-right pb-2 font-medium">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.holdings.map((h) => (
                        <tr key={h.symbol} className="border-b border-[#0f1a2e] last:border-0">
                          <td className="py-2.5">
                            <p className="text-white font-medium">{h.symbol}</p>
                            <p className="text-[#4a5c70] text-[10px] truncate max-w-25">{h.name}</p>
                          </td>
                          <td className="py-2.5 text-right text-[#94a3b8]">
                            {h.quantity.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 text-right text-[#94a3b8] hidden sm:table-cell">
                            {formatIDR(h.avg_buy_price, true)}
                          </td>
                          <td className="py-2.5 text-right text-white">
                            {formatIDR(h.current_price, true)}
                          </td>
                          <td className={`py-2.5 text-right ${pnlColor(h.unrealized_pnl)}`}>
                            <p>{formatIDR(h.unrealized_pnl, true)}</p>
                            <p className="text-[10px] opacity-75">{formatPct(h.unrealized_pnl_pct)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-[#111e35] rounded-xl p-4 border border-[#1e2d4a]">
              <SectionHeader title="Recent Activity" />
              {!data?.recent_transactions.length ? (
                <p className="text-[#4a5c70] text-xs py-4 text-center">No transactions yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recent_transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        tx.transaction_type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.transaction_type === 'BUY' ? 'B' : 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium">{tx.transaction_type} {tx.symbol}</p>
                        <p className="text-[#4a5c70] text-[10px]">
                          {tx.quantity.toLocaleString('id-ID')} shares · {formatDate(tx.created_at)}
                        </p>
                      </div>
                      <p className={`text-xs font-medium shrink-0 ${
                        tx.transaction_type === 'BUY' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {tx.transaction_type === 'BUY' ? '-' : '+'}{formatIDR(tx.total_amount, true)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Market Movers */}
          {(data?.movers.gainers.length || data?.movers.losers.length) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#111e35] rounded-xl p-4 border border-[#1e2d4a]">
                <SectionHeader title="Top Gainers" />
                <div className="space-y-2.5">
                  {data!.movers.gainers.map((m) => <MoverRow key={m.symbol} item={m} />)}
                </div>
              </div>
              <div className="bg-[#111e35] rounded-xl p-4 border border-[#1e2d4a]">
                <SectionHeader title="Top Losers" />
                <div className="space-y-2.5">
                  {data!.movers.losers.map((m) => <MoverRow key={m.symbol} item={m} />)}
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

