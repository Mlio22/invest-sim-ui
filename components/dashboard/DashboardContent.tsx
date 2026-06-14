'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import { authLog } from '@/lib/auth-debug';
import { formatDate, formatIDR, formatPct, pnlColor } from '@/lib/format';
import type { DashboardData, MoverItem, PerformancePoint } from '@/lib/mockData';
import { MOCK_DASHBOARD, MOCK_PERFORMANCE } from '@/lib/mockData';

const PerformanceChart = dynamic(() => import('./PerformanceChart'), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center text-[#4a5c70] text-sm">
      Loading chart...
    </div>
  ),
});



// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kapita-token');
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

function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [perfData, setPerfData] = useState<PerformancePoint[]>([]);
  const [range, setRange] = useState<Range>('1M');
  const [loading, setLoading] = useState(true);
  const [perfLoading, setPerfLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('kapita-token');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = getToken();
    authLog('Dashboard', 'auth check', {
      hasToken: !!token,
      origin: window.location.origin,
      API_URL,
    });
    if (!token) {
      authLog('Dashboard', 'no token — redirecting to /login');
      router.push('/login');
      return;
    }

    fetch(`${API_URL}/api/v1/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          authLog('Dashboard', 'API returned 401 — logging out');
          logout();
          return null;
        }
        if (!r.ok) throw new Error('Failed to load dashboard');
        return r.json();
      })
      .then((json) => {
        if (json?.data) {
          setData(json.data as DashboardData);
        } else {
          setData(MOCK_DASHBOARD);
        }
      })
      .catch(() => setData(MOCK_DASHBOARD))
      .finally(() => setLoading(false));
  }, [router, logout]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setPerfLoading(true);
    fetch(`${API_URL}/api/v1/portfolio/performance?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data?.points?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPerfData(json.data.points.map((p: any) => ({
            date: p.date,
            value: parseFloat(p.value),
          })));
        } else {
          setPerfData(MOCK_PERFORMANCE[range] ?? MOCK_PERFORMANCE['1M']);
        }
      })
      .catch(() => setPerfData(MOCK_PERFORMANCE[range] ?? MOCK_PERFORMANCE['1M']))
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

  const p = data?.portfolio;

  return (
    <AppLayout activePage="portfolio">
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-24 md:pb-6">
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
    </AppLayout>
  );
}

