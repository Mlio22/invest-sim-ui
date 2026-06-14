'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import { formatPct, formatPrice, formatVol, pnlColor, toNum } from '@/lib/format';
import type { IndexQuote, MarketMovers, StockQuote } from '@/lib/mockData';
import { MOCK_INDEXES, MOCK_MOVERS, MOCK_STOCKS } from '@/lib/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─── Sector metadata ──────────────────────────────────────────────────────────

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  Banking: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  ),
  Technology: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Energy: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Mining: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 22 10-10" /><path d="m16 8-1.5 1.5" /><path d="M17 2l5 5-12.5 12.5-5-5z" /><path d="m22 7-2 2" />
    </svg>
  ),
  'Consumer Goods': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  Telecom: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Infrastructure: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Automotive: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  Healthcare: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Industrial: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
};

function SectorIcon({ sector }: { sector: string }) {
  const icon = SECTOR_ICONS[sector];
  if (icon) return icon;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

// ─── Symbol Badge ─────────────────────────────────────────────────────────────

function SymbolBadge({ symbol }: { symbol: string }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-[#1e2d4a] flex items-center justify-center
      text-[#f97316] font-bold text-xs flex-shrink-0">
      {symbol.slice(0, 2)}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#1e2d4a]/30 ${className}`} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MarketsContent() {
  const router = useRouter();

  const [movers, setMovers] = useState<MarketMovers | null>(null);
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [indexes] = useState<IndexQuote[]>(MOCK_INDEXES);
  const [loading, setLoading] = useState(true);
  const [moversTab, setMoversTab] = useState<'gainers' | 'losers'>('gainers');

  // Fetch market data
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/v1/market/movers`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/api/v1/market/stocks`).then(r => r.json()).catch(() => null),
    ]).then(([moversData, stocksData]) => {
      setMovers(moversData?.success ? moversData.data : MOCK_MOVERS);
      setStocks(stocksData?.success && stocksData.data?.length ? stocksData.data : MOCK_STOCKS);
    }).finally(() => setLoading(false));
  }, []);

  // Sector performance aggregated from popular stocks
  const sectors = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    stocks.forEach(s => {
      if (!s.sector) return;
      const pct = toNum(s.change_percent);
      const entry = map.get(s.sector) ?? { sum: 0, count: 0 };
      entry.sum += pct;
      entry.count += 1;
      map.set(s.sector, entry);
    });
    return Array.from(map.entries())
      .map(([name, { sum, count }]) => ({ name, avg: sum / count }))
      .sort((a, b) => Math.abs(b.avg) - Math.abs(a.avg));
  }, [stocks]);

  const handleSelectStock = useCallback((symbol: string) => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('kapita-recent-searches') || '[]');
      const updated = [symbol, ...saved.filter(s => s !== symbol)].slice(0, 6);
      localStorage.setItem('kapita-recent-searches', JSON.stringify(updated));
    } catch { /* noop */ }
    router.push(`/stocks/${symbol}`);
  }, [router]);

  const moversItems = moversTab === 'gainers' ? movers?.gainers : movers?.losers;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <AppLayout activePage="markets">
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-8 pb-24 md:pb-6">

          {/* ── Market Overview ─────────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Market Overview</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-4 snap-x snap-mandatory md:snap-none">
              {indexes.map(idx => {
                const positive = idx.change_pct >= 0;
                return (
                  <div key={idx.symbol} className="min-w-[160px] md:min-w-0 flex-shrink-0 snap-start bg-[#111e35] border border-[#1e2d4a] rounded-xl p-4">
                    <div className="text-[#94a3b8] text-xs font-mono font-medium mb-0.5">{idx.name}</div>
                    <div className="text-white text-xl font-bold mt-1">
                      {idx.value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? '+' : ''}{idx.change_pct.toFixed(2)}%
                    </div>
                    <div className={`text-xs mt-0.5 ${positive ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                      {positive ? '+' : ''}{idx.change.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Top Movers + Sectors ────────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Top Movers */}
            <section className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Top Movers</h2>
                <div className="flex gap-1 bg-[#111e35] border border-[#1e2d4a] rounded-lg p-0.5">
                  {(['gainers', 'losers'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setMoversTab(tab)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors
                        ${moversTab === tab
                          ? tab === 'gainers'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                          : 'text-[#94a3b8] hover:text-white'}`}>
                      {tab === 'gainers' ? 'Gainers' : 'Losers'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px_56px] px-4 py-2.5
                  border-b border-[#1e2d4a] text-[#4a5c70] text-xs font-medium uppercase tracking-wider">
                  <span>Asset</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Change</span>
                  <span className="text-right">Vol</span>
                </div>
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : moversItems?.length ? (
                  moversItems.map(m => {
                    const stockData = stocks.find(s => s.symbol === m.symbol);
                    return (
                      <div
                        key={m.symbol}
                        onClick={() => handleSelectStock(m.symbol)}
                        className="grid grid-cols-[1fr_80px_80px_56px] px-4 py-3
                          border-b border-[#1e2d4a]/40 last:border-b-0
                          hover:bg-[#1e2d4a]/20 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <SymbolBadge symbol={m.symbol} />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">{m.symbol}</div>
                            <div className="text-[#94a3b8] text-xs truncate">{m.name}</div>
                          </div>
                        </div>
                        <div className="text-right text-sm self-center font-medium">
                          {formatPrice(m.price)}
                        </div>
                        <div className={`text-right text-sm self-center font-semibold ${pnlColor(m.change_pct)}`}>
                          {formatPct(m.change_pct)}
                        </div>
                        <div className="text-right text-xs self-center text-[#94a3b8]">
                          {stockData ? formatVol(stockData.volume) : '—'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-[#4a5c70] text-sm">No data available</div>
                )}
              </div>
            </section>

            {/* Sectors */}
            <section className="lg:w-72 xl:w-80 flex-shrink-0">
              <h2 className="text-lg font-semibold mb-4">Sectors</h2>
              {loading ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[72px]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {sectors.slice(0, 5).map(sec => (
                    <div
                      key={sec.name}
                      className="bg-[#111e35] border border-[#1e2d4a] rounded-xl p-3
                        cursor-pointer hover:border-[#f97316]/30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`${pnlColor(sec.avg)}`}>
                          <SectorIcon sector={sec.name} />
                        </span>
                        <span className={`text-sm font-bold ${pnlColor(sec.avg)}`}>
                          {formatPct(sec.avg)}
                        </span>
                      </div>
                      <div className="text-xs text-[#94a3b8] truncate">{sec.name}</div>
                    </div>
                  ))}
                  <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl p-3
                    cursor-pointer hover:border-[#f97316]/30 transition-colors
                    flex items-center justify-center">
                    <span className="text-xs text-[#f97316] font-semibold">View All →</span>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Popular Stocks ──────────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Popular Stocks</h2>
            <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_88px_80px_72px] px-4 py-2.5
                border-b border-[#1e2d4a] text-[#4a5c70] text-xs font-medium uppercase tracking-wider">
                <span>Asset</span>
                <span className="text-right">Price</span>
                <span className="text-right">Change</span>
                <span className="text-right">Volume</span>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : stocks.length === 0 ? (
                <div className="py-10 text-center text-[#4a5c70] text-sm">No data available</div>
              ) : (
                stocks.map(s => (
                  <div
                    key={s.symbol}
                    onClick={() => handleSelectStock(s.symbol)}
                    className="grid grid-cols-[1fr_88px_80px_72px] px-4 py-3
                      border-b border-[#1e2d4a]/40 last:border-b-0
                      hover:bg-[#1e2d4a]/20 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SymbolBadge symbol={s.symbol} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{s.symbol}</div>
                        <div className="text-[#94a3b8] text-xs truncate">{s.name}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm self-center font-medium">
                      {formatPrice(s.price)}
                    </div>
                    <div className={`text-right text-sm self-center font-semibold ${pnlColor(s.change_percent)}`}>
                      {formatPct(s.change_percent)}
                    </div>
                    <div className="text-right text-xs self-center text-[#94a3b8]">
                      {formatVol(s.volume)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </main>
    </AppLayout>
  );
}
