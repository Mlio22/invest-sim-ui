'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import AppLayout from '@/components/layout/AppLayout';
import { formatIDR, formatPct, formatVol, pnlColor, toNum } from '@/lib/format';
import type { StockDetail as StockDetailType, StockPosition } from '@/lib/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OHLCVPoint {
  timestamp: string;
  close: string;
}

interface ChartPoint {
  date: string;
  value: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const RANGE_OPTIONS: { label: string; range: string; interval: string }[] = [
  { label: '1D', range: '1d',  interval: '5m' },
  { label: '1W', range: '5d',  interval: '1d' },
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1wk' },
  { label: '1Y', range: '1y',  interval: '1wk' },
  { label: 'MAX', range: '5y', interval: '1mo' },
];

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kapita-token');
}

// ─── Chart (recharts, dynamic import) ─────────────────────────────────────────

const StockChart = dynamic(
  () =>
    import('recharts').then(({ AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer }) => {
      function Chart({ data, positive }: { data: ChartPoint[]; positive: boolean }) {
        const color = positive ? '#10b981' : '#ef4444';
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{ background: '#111e35', border: '1px solid #1e2d4a', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v) => [
                  v !== null && v !== undefined ? `Rp ${Number(v).toLocaleString('id-ID')}` : '—',
                  'Price',
                ] as [string, string]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill="url(#stockGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      }
      return Chart;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-50 flex items-center justify-center text-[#4a5c70] text-sm">
        Loading chart...
      </div>
    ),
  },
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#1e2d4a]/30 ${className}`} />;
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1e2d4a] last:border-0">
      <span className="text-[#4a5c70] text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { symbol: string; }

export default function StockDetail({ symbol }: Props) {
  const router = useRouter();

  const [quote, setQuote] = useState<StockDetailType | null>(null);
  const [position, setPosition] = useState<StockPosition | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [rangeIdx, setRangeIdx] = useState(2); // default 1M
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [lots, setLots] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const token = typeof window !== 'undefined' ? getToken() : null;
  const apiSymbol = symbol.endsWith('.JK') ? symbol : `${symbol}.JK`;

  // Fetch quote + position
  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    Promise.all([
      fetch(`${API_URL}/api/v1/market/quote/${apiSymbol}`).then(r => r.json()).catch(() => null),
      token
        ? fetch(`${API_URL}/api/v1/portfolio/position/${symbol}`, { headers }).then(r => r.json()).catch(() => null)
        : Promise.resolve(null),
    ]).then(([quoteData, positionData]) => {
      if (quoteData?.success) setQuote(quoteData.data);
      if (positionData?.success) setPosition(positionData.data);
    }).finally(() => setLoading(false));
  }, [apiSymbol, symbol, token]);

  // Fetch watchlist status
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/v1/watchlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.success && Array.isArray(data.data?.items)) {
          const inList = data.data.items.some(
            (item: { symbol: string }) => item.symbol === apiSymbol || item.symbol === symbol
          );
          setIsInWatchlist(inList);
        }
      })
      .catch(() => {});
  }, [apiSymbol, symbol, token]);

  const handleWatchlistToggle = useCallback(async () => {
    if (!token) { router.push('/login'); return; }
    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        await fetch(`${API_URL}/api/v1/watchlist/${apiSymbol}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsInWatchlist(false);
      } else {
        await fetch(`${API_URL}/api/v1/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ symbol: apiSymbol, note: '' }),
        });
        setIsInWatchlist(true);
      }
    } catch { /* noop */ } finally {
      setWatchlistLoading(false);
    }
  }, [token, isInWatchlist, apiSymbol, router]);

  // Fetch chart data
  const fetchChart = useCallback((idx: number) => {
    const { range, interval } = RANGE_OPTIONS[idx];
    setChartLoading(true);
    fetch(`${API_URL}/api/v1/market/historical/${apiSymbol}?range=${range}&interval=${interval}`)
      .then(r => r.json())
      .then(data => {
        if (data?.success && Array.isArray(data.data?.data)) {
          const pts: ChartPoint[] = (data.data.data as OHLCVPoint[])
            .filter(p => p.close && Number(p.close) > 0)
            .map(p => ({
              date: new Date(p.timestamp).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
              value: toNum(p.close),
            }));
          setChartData(pts);
        }
      })
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [apiSymbol]);

  useEffect(() => { fetchChart(rangeIdx); }, [rangeIdx, fetchChart]);

  const handleRangeChange = (idx: number) => {
    setRangeIdx(idx);
  };

  // Buy / Sell
  const estimatedCost = quote && lots
    ? toNum(quote.price) * (parseInt(lots, 10) || 0) * 100
    : 0;

  const handleTransaction = async () => {
    if (!token) { router.push('/login'); return; }
    if (!lots || parseInt(lots, 10) <= 0) { setTxError('Enter a valid number of lots'); return; }

    const quantity = parseInt(lots, 10) * 100;
    setTxLoading(true);
    setTxError('');
    setTxSuccess('');

    try {
      const endpoint = activeTab === 'buy' ? '/api/v1/transactions/buy' : '/api/v1/transactions/sell';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol: apiSymbol, quantity }),
      });
      const data = await res.json();
      if (data?.success) {
        setTxSuccess(`${activeTab === 'buy' ? 'Buy' : 'Sell'} order executed!`);
        setLots('');
        // Refresh position
        fetch(`${API_URL}/api/v1/portfolio/position/${symbol}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).then(d => { if (d?.success) setPosition(d.data); });
      } else {
        setTxError(data?.message || 'Transaction failed');
      }
    } catch {
      setTxError('Network error. Please try again.');
    } finally {
      setTxLoading(false);
    }
  };

  const priceNum = quote ? toNum(quote.price) : 0;
  const changeNum = quote ? toNum(quote.change_percent) : 0;
  const chartPositive = changeNum >= 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout activePage="markets">
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-24 md:pb-6">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[#4a5c70] hover:text-white transition-colors mb-4 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left column (chart + stats) ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Header */}
            {loading ? (
              <div className="space-y-2">
                <Sk className="h-7 w-40" />
                <Sk className="h-10 w-56" />
                <Sk className="h-5 w-32" />
              </div>
            ) : quote ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#f97316] font-mono font-bold text-lg">{symbol}</span>
                  {quote.sector && (
                    <span className="text-[#4a5c70] text-xs px-2 py-0.5 bg-[#111e35] border border-[#1e2d4a] rounded-full">
                      {quote.sector}
                    </span>
                  )}
                </div>
                <p className="text-[#94a3b8] text-sm mb-2">{quote.name}</p>
                <div className="flex items-end gap-3">
                  <span className="text-white text-3xl font-bold">
                    Rp {priceNum.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-base font-semibold pb-0.5 ${pnlColor(quote.change_percent)}`}>
                    {toNum(quote.change) >= 0 ? '+' : ''}{toNum(quote.change).toLocaleString('id-ID')}
                    {' '}({formatPct(quote.change_percent)})
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-red-400 text-sm">Failed to load quote for {symbol}</p>
            )}

            {/* Chart */}
            <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl p-4">
              {/* Range selector */}
              <div className="flex gap-1 mb-4">
                {RANGE_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.label}
                    onClick={() => handleRangeChange(i)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      rangeIdx === i
                        ? 'bg-[#f97316] text-white'
                        : 'text-[#4a5c70] hover:text-white hover:bg-[#1e2d4a]'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {chartLoading ? (
                <div className="h-50 flex items-center justify-center text-[#4a5c70] text-sm">
                  Loading chart...
                </div>
              ) : chartData.length > 0 ? (
                <StockChart data={chartData} positive={chartPositive} />
              ) : (
                <div className="h-50 flex items-center justify-center text-[#4a5c70] text-sm">
                  No chart data available
                </div>
              )}
            </div>

            {/* Key Statistics */}
            <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">Key Statistics</h3>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => <Sk key={i} className="h-8" />)}
                </div>
              ) : quote ? (
                <div>
                  <StatRow label="Open"         value={`Rp ${toNum(quote.open).toLocaleString('id-ID')}`} />
                  <StatRow label="Day High"      value={`Rp ${toNum(quote.high).toLocaleString('id-ID')}`} />
                  <StatRow label="Day Low"       value={`Rp ${toNum(quote.low).toLocaleString('id-ID')}`} />
                  <StatRow label="Prev Close"    value={`Rp ${toNum(quote.prev_close).toLocaleString('id-ID')}`} />
                  <StatRow label="Volume"        value={formatVol(quote.volume)} />
                  <StatRow label="Market Cap"    value={formatIDR(quote.market_cap, true)} />
                  <StatRow label="P/E Ratio"     value={toNum(quote.trailing_pe) > 0 ? toNum(quote.trailing_pe).toFixed(2) : '—'} />
                  <StatRow label="52w High"      value={`Rp ${toNum(quote.week_52_high).toLocaleString('id-ID')}`} />
                  <StatRow label="52w Low"       value={`Rp ${toNum(quote.week_52_low).toLocaleString('id-ID')}`} />
                </div>
              ) : null}
            </div>

            {/* My Position */}
            {position && (
              <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">My Position</h3>
                {position.lots === 0 ? (
                  <p className="text-[#4a5c70] text-sm">You don&apos;t own any shares of {symbol}.</p>
                ) : (
                  <div>
                    <StatRow label="Lots Owned"     value={`${position.lots} lots (${position.quantity.toLocaleString()} shares)`} />
                    <StatRow label="Avg Buy Price"  value={`Rp ${toNum(position.avg_buy_price).toLocaleString('id-ID')}`} />
                    <StatRow label="Current Price"  value={`Rp ${toNum(position.current_price).toLocaleString('id-ID')}`} />
                    <StatRow label="Market Value"   value={formatIDR(position.market_value)} />
                    <div className="flex items-center justify-between py-2 border-b border-[#1e2d4a]">
                      <span className="text-[#4a5c70] text-sm">Unrealized P&amp;L</span>
                      <span className={`text-sm font-semibold ${pnlColor(position.unrealized_pnl)}`}>
                        {formatIDR(position.unrealized_pnl)} ({formatPct(position.unrealized_pnl_pct)})
                      </span>
                    </div>
                    <StatRow label="Allocation"    value={`${toNum(position.allocation_pct).toFixed(2)}%`} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right column (buy/sell panel) ── */}
          <div className="w-full lg:w-80 shrink-0">

            {/* Watchlist Toggle */}
            <button
              onClick={handleWatchlistToggle}
              disabled={watchlistLoading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl mb-3
                border text-sm font-medium transition-colors
                ${isInWatchlist
                  ? 'bg-[#f97316]/10 border-[#f97316]/40 text-[#f97316] hover:bg-[#f97316]/20'
                  : 'bg-[#111e35] border-[#1e2d4a] text-[#94a3b8] hover:border-[#f97316]/40 hover:text-[#f97316]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}>
              <span>{isInWatchlist ? '★' : '☆'}</span>
              {watchlistLoading ? 'Updating...' : isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>

            <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl p-4 sticky top-4">
              <h3 className="text-white font-semibold mb-4">Trade {symbol}</h3>

              {/* Tab */}
              <div className="flex gap-1 bg-[#0b1326] border border-[#1e2d4a] rounded-lg p-0.5 mb-4">
                {(['buy', 'sell'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setTxError(''); setTxSuccess(''); setLots(''); }}
                    className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors capitalize ${
                      activeTab === tab
                        ? tab === 'buy' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        : 'text-[#4a5c70] hover:text-white'
                    }`}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* Available cash */}
              <div className="flex items-center justify-between mb-3 py-2 bg-[#0b1326] rounded-lg px-3">
                <span className="text-[#4a5c70] text-xs">Available Cash</span>
                <span className="text-white text-sm font-medium">
                  {position ? formatIDR(position.cash_balance) : '—'}
                </span>
              </div>

              {/* Market price */}
              <div className="flex items-center justify-between mb-4 py-2 bg-[#0b1326] rounded-lg px-3">
                <span className="text-[#4a5c70] text-xs">Market Price</span>
                <span className="text-white text-sm font-medium">
                  {loading ? '—' : quote ? `Rp ${priceNum.toLocaleString('id-ID')}` : '—'}
                </span>
              </div>

              {/* Lots input */}
              <div className="mb-3">
                <label className="text-[#4a5c70] text-xs mb-1.5 block">
                  Lots <span className="text-[#94a3b8]">(1 lot = 100 shares)</span>
                </label>
                <div className="flex items-center gap-2 bg-[#0b1326] border border-[#1e2d4a] rounded-xl px-3 py-2.5 focus-within:border-[#f97316]/60">
                  <button
                    onClick={() => setLots(l => Math.max(0, (parseInt(l, 10) || 0) - 1).toString())}
                    className="text-[#4a5c70] hover:text-white text-lg font-bold w-6 text-center">
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={lots}
                    onChange={e => setLots(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="flex-1 bg-transparent text-white text-center text-sm outline-none placeholder-[#4a5c70]"
                  />
                  <button
                    onClick={() => setLots(l => ((parseInt(l, 10) || 0) + 1).toString())}
                    className="text-[#4a5c70] hover:text-white text-lg font-bold w-6 text-center">
                    +
                  </button>
                </div>
              </div>

              {/* Estimated cost */}
              <div className="flex items-center justify-between mb-5 py-2 bg-[#0b1326] rounded-lg px-3">
                <span className="text-[#4a5c70] text-xs">Estimated {activeTab === 'buy' ? 'Cost' : 'Proceeds'}</span>
                <span className="text-white text-sm font-semibold">
                  {estimatedCost > 0 ? formatIDR(estimatedCost.toString()) : '—'}
                </span>
              </div>

              {/* Feedback */}
              {txError && <p className="text-red-400 text-xs mb-3 text-center">{txError}</p>}
              {txSuccess && <p className="text-emerald-400 text-xs mb-3 text-center">{txSuccess}</p>}

              {/* Action button */}
              <button
                onClick={handleTransaction}
                disabled={txLoading || !lots || parseInt(lots, 10) <= 0}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeTab === 'buy'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-red-500 hover:bg-red-400 text-white'
                }`}>
                {txLoading
                  ? 'Processing...'
                  : activeTab === 'buy'
                  ? `Buy ${lots || 0} Lot${parseInt(lots, 10) !== 1 ? 's' : ''}`
                  : `Sell ${lots || 0} Lot${parseInt(lots, 10) !== 1 ? 's' : ''}`}
              </button>

              <p className="text-[#4a5c70] text-[10px] text-center mt-3">
                Prices are delayed. Final cost calculated at execution.
              </p>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
