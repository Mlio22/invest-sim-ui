'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { formatIDR, formatPct, pnlColor, toNum } from '@/lib/format';
import type { Decimal } from '@/lib/format';

export type ActivePage = 'portfolio' | 'markets' | 'leaderboard' | 'wallet' | 'profile';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ─── IDX Stock search list ────────────────────────────────────────────────────

const IDX_STOCKS = [
  { symbol: 'BBCA', name: 'Bank Central Asia' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia' },
  { symbol: 'BMRI', name: 'Bank Mandiri' },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia' },
  { symbol: 'TLKM', name: 'Telkom Indonesia' },
  { symbol: 'ASII', name: 'Astra International' },
  { symbol: 'UNVR', name: 'Unilever Indonesia' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia' },
  { symbol: 'BREN', name: 'Barito Renewables' },
  { symbol: 'ADRO', name: 'Adaro Minerals' },
  { symbol: 'PGAS', name: 'Perusahaan Gas Negara' },
  { symbol: 'KLBF', name: 'Kalbe Farma' },
  { symbol: 'INDF', name: 'Indofood Sukses Makmur' },
  { symbol: 'ICBP', name: 'Indofood CBP' },
  { symbol: 'SMGR', name: 'Semen Indonesia' },
  { symbol: 'EXCL', name: 'XL Axiata' },
  { symbol: 'JSMR', name: 'Jasa Marga' },
  { symbol: 'PTBA', name: 'Bukit Asam' },
  { symbol: 'ANTM', name: 'Aneka Tambang' },
  { symbol: 'TOWR', name: 'Sarana Menara Nusantara' },
];

interface PortfolioSummary {
  totalValue: Decimal;
  cashBalance: Decimal;
  totalPnl: Decimal;
  totalPnlPct: Decimal;
  todayPnl: Decimal;
  todayPnlPct: Decimal;
}

interface AppLayoutProps {
  activePage: ActivePage;
  children: React.ReactNode;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconTrendUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconPortfolio({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function IconMarkets({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function IconLeaderboard({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="18" y="3" width="4" height="18" rx="1" />
      <rect x="10" y="8" width="4" height="13" rx="1" />
      <rect x="2" y="13" width="4" height="8" rx="1" />
    </svg>
  );
}

function IconWallet({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
      <path d="M16 12h.01" />
      <path d="M3 10h18" />
    </svg>
  );
}

function IconProfile({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={active ? 2 : 1.75}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  id: ActivePage;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'portfolio',   label: 'Portfolio',   icon: (a) => <IconPortfolio active={a} />,   path: '/dashboard' },
  { id: 'markets',     label: 'Markets',     icon: (a) => <IconMarkets active={a} />,     path: '/markets' },
  { id: 'leaderboard', label: 'Leaderboard', icon: (a) => <IconLeaderboard active={a} />, path: '/leaderboard' },
  { id: 'wallet',      label: 'Wallet',      icon: (a) => <IconWallet active={a} />,      path: '/wallet' },
  { id: 'profile',     label: 'Profile',     icon: (a) => <IconProfile active={a} />,     path: '/profile' },
];

// ─── Assets hover widget ──────────────────────────────────────────────────────

function AssetsWidget({ summary }: { summary: PortfolioSummary | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!summary) return null;

  const overallPos = toNum(summary.totalPnl) >= 0;
  const todayPos   = toNum(summary.todayPnl)  >= 0;

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111e35] border border-[#1e2d4a] hover:border-[#f97316]/40 transition-colors"
      >
        <div className="text-right">
          <p className="text-[#4a5c70] text-[9px] uppercase tracking-wider leading-none mb-0.5">Total Assets</p>
          <p className="text-white font-bold text-sm leading-none">{formatIDR(summary.totalValue, true)}</p>
        </div>
        <span className={`text-xs font-semibold ${pnlColor(summary.totalPnl)}`}>
          {overallPos ? '+' : ''}{formatPct(summary.totalPnlPct)}
        </span>
        <span className="text-[#4a5c70]"><IconChevronDown /></span>
      </button>

      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 top-full mt-2 w-64 bg-[#0d1829] border border-[#1e2d4a] rounded-2xl p-4 shadow-2xl z-50"
        >
          <p className="text-[#4a5c70] text-xs uppercase tracking-wider mb-3">Portfolio Overview</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8] text-sm">Total Assets</span>
              <span className="text-white font-semibold text-sm">{formatIDR(summary.totalValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8] text-sm">Cash Balance</span>
              <span className="text-white text-sm">{formatIDR(summary.cashBalance)}</span>
            </div>
            <div className="border-t border-[#1e2d4a] pt-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[#94a3b8] text-sm">Overall P&amp;L</span>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${pnlColor(summary.totalPnl)}`}>
                    {overallPos ? '+' : ''}{formatIDR(summary.totalPnl)}
                  </span>
                  <span className={`text-xs ml-1 ${pnlColor(summary.totalPnl)}`}>
                    ({overallPos ? '+' : ''}{formatPct(summary.totalPnlPct)})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94a3b8] text-sm">Today&apos;s P&amp;L</span>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${pnlColor(summary.todayPnl)}`}>
                    {todayPos ? '+' : ''}{formatIDR(summary.todayPnl)}
                  </span>
                  <span className={`text-xs ml-1 ${pnlColor(summary.todayPnl)}`}>
                    ({todayPos ? '+' : ''}{formatPct(summary.todayPnlPct)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Search modal ─────────────────────────────────────────────────────────────

function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kapita-recent-searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch { /* noop */ }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const results = query.trim()
    ? IDX_STOCKS.filter(s =>
        s.symbol.startsWith(query.toUpperCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      )
    : IDX_STOCKS.slice(0, 8);

  const handleSelect = (symbol: string) => {
    const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('kapita-recent-searches', JSON.stringify(updated));
    onClose();
    router.push(`/stocks/${symbol}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1326]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2d4a] shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-[#111e35] border border-[#f97316]/40 rounded-xl px-3 py-2.5">
          <span className="text-[#4a5c70]"><IconSearch /></span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].symbol); }}
            placeholder="Search symbol, company..."
            className="flex-1 bg-transparent text-white placeholder-[#4a5c70] text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#94a3b8] hover:text-white p-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-[#f97316] text-sm font-medium px-1 shrink-0">
          Cancel
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {recentSearches.length > 0 && !query.trim() && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#94a3b8] text-xs font-semibold tracking-widest uppercase">Recent Searches</span>
              <button
                onClick={() => { setRecentSearches([]); localStorage.removeItem('kapita-recent-searches'); }}
                className="text-[#f97316] text-xs font-medium uppercase tracking-wider">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map(sym => (
                <button
                  key={sym}
                  onClick={() => setQuery(sym)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111e35] border border-[#1e2d4a]
                    rounded-lg text-sm text-[#94a3b8] hover:text-white hover:border-[#f97316]/30 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                  </svg>
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-[#94a3b8] text-xs font-semibold tracking-widest uppercase mb-3">
            {query.trim() ? `Results for "${query}"` : 'Popular Instruments'}
          </div>
          {results.length === 0 ? (
            <div className="text-center py-16 text-[#4a5c70] text-sm">No stocks found</div>
          ) : (
            <div className="space-y-1">
              {results.map(s => (
                <button
                  key={s.symbol}
                  onClick={() => handleSelect(s.symbol)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#111e35] transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-[#1e2d4a] flex items-center justify-center text-[#f97316] font-bold text-xs shrink-0">
                    {s.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{s.symbol}</div>
                    <div className="text-[#94a3b8] text-xs truncate">{s.name}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a5c70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── User dropdown ────────────────────────────────────────────────────────────

function UserMenu({ email, onLogout }: { email: string; onLogout: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = email ? email.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#1e2d4a] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initial}
        </div>
        <span className="hidden xl:block text-[#94a3b8] text-sm truncate max-w-[120px]">{email}</span>
        <span className="hidden xl:block text-[#4a5c70]"><IconChevronDown /></span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-[#0d1829] border border-[#1e2d4a] rounded-2xl overflow-hidden shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-[#1e2d4a]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white text-base font-bold mx-auto mb-2">
              {initial}
            </div>
            <p className="text-white text-sm font-medium text-center truncate">{email}</p>
          </div>
          <div className="p-1.5">
            <button
              onClick={() => { router.push('/profile'); setOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[#94a3b8] hover:bg-[#1e2d4a] hover:text-white transition-colors text-sm"
            >
              <IconProfile />
              Profile
            </button>
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[#94a3b8] hover:bg-[#1e2d4a] hover:text-red-400 transition-colors text-sm"
            >
              <IconLogout />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AppLayout({ activePage, children }: AppLayoutProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('kapita-token');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kapita-token') : null;
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setEmail(payload.email || payload.sub || '');
    } catch { /* ignore */ }

    fetch(`${API_URL}/api/v1/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (json?.data?.portfolio) {
          const p = json.data.portfolio;
          setSummary({
            totalValue:  p.total_value,
            cashBalance: p.cash_balance,
            totalPnl:    p.total_pnl,
            totalPnlPct: p.total_pnl_pct,
            todayPnl:    p.today_pnl,
            todayPnlPct: p.today_pnl_pct,
          });
        }
      })
      .catch(() => { /* silent */ });
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
    {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    <div className="flex h-screen overflow-hidden bg-[#0b1326] text-white">

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[#0d1829] border-r border-[#1e2d4a] h-full overflow-y-auto px-4 py-6">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-[#f97316] rounded-lg flex items-center justify-center shrink-0">
            <IconTrendUp />
          </div>
          <span className="text-[#f97316] font-bold text-lg tracking-[0.2em]">KAPITA</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-[#f97316]/10 text-[#f97316]'
                    : 'text-[#94a3b8] hover:bg-[#1e2d4a] hover:text-white'
                }`}
              >
                {item.icon(active)}
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0b1326] border-b border-[#1e2d4a]">
          <span className="text-[#f97316] font-bold tracking-[0.2em] text-base">KAPITA</span>
          <div className="flex items-center gap-2">
            <button className="text-[#4a5c70] hover:text-white transition-colors p-1">
              <IconBell />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white text-xs font-bold">
              {email ? email.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Desktop header — unified across all pages */}
        <header className="hidden md:flex sticky top-0 z-30 items-center gap-4 px-6 py-3 border-b border-[#1e2d4a] bg-[#0b1326]">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-[#111e35] border border-[#1e2d4a]
              rounded-xl text-[#4a5c70] text-sm hover:border-[#f97316]/40 transition-colors w-full max-w-xs lg:max-w-sm">
            <IconSearch />
            <span>Search instruments...</span>
            <span className="ml-auto font-mono text-xs bg-[#1e2d4a] px-1.5 py-0.5 rounded">⌘K</span>
          </button>
          <div className="flex items-center gap-3 ml-auto shrink-0">
            <AssetsWidget summary={summary} />
            <button className="text-[#4a5c70] hover:text-white transition-colors p-1">
              <IconBell />
            </button>
            <UserMenu email={email} onLogout={logout} />
          </div>
        </header>

        {/* Page content */}
        {children}

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d1829] border-t border-[#1e2d4a] flex z-40">
          {NAV_ITEMS.filter(i => i.id !== 'profile').map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] transition-colors ${
                  active ? 'text-[#f97316]' : 'text-[#4a5c70]'
                }`}
              >
                {item.icon(active)}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
    </>
  );
}
