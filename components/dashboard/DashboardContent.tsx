"use client";

import KapitaLogo from "@/components/auth/KapitaLogo";
import { useI18n } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8888";
const TOKEN_KEY = "kapita-token";

interface IdentityClaims {
  user_id: string;
  service: string;
  provider: string;
  provider_account_id: string;
  email?: string;
  email_verified: boolean;
  expires_at: number;
}

const DUMMY_HOLDINGS = [
  { ticker: "BBCA", name: "Bank Central Asia", lot: 100, price: 9500, change: 1.54 },
  { ticker: "TLKM", name: "Telkom Indonesia", lot: 200, price: 3220, change: -0.31 },
  { ticker: "BBRI", name: "Bank Rakyat Indonesia", lot: 150, price: 5125, change: 2.10 },
  { ticker: "GOTO", name: "GoTo Gojek Tokopedia", lot: 1000, price: 76, change: 4.11 },
  { ticker: "ASII", name: "Astra International", lot: 100, price: 6250, change: -0.80 },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl p-5">
      <p className="text-[#4a5c70] text-xs tracking-widest uppercase mb-2">
        {label}
      </p>
      <p
        className={`text-2xl font-extrabold ${positive === false ? "text-red-400" : positive ? "text-[#22c55e]" : "text-white"}`}
      >
        {value}
      </p>
      {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardContent() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [user, setUser] = useState<IdentityClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    fetch(`${AUTH_BASE}/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid");
        return res.json() as Promise<IdentityClaims>;
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        router.replace("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1326]">
        <div className="w-10 h-10 rounded-full border-2 border-[#1e2d4a] border-t-[#f97316] animate-spin" />
      </div>
    );
  }

  const totalValue = DUMMY_HOLDINGS.reduce(
    (sum, h) => sum + h.lot * h.price * 100,
    0
  );
  const displayName = user?.email?.split("@")[0] ?? user?.provider_account_id ?? "Trader";

  return (
    <div className="min-h-screen bg-[#0b1326] flex flex-col">
      {/* ── Navbar ── */}
      <header className="border-b border-[#1e2d4a] bg-[#0d1829] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <KapitaLogo />
          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f97316]/20 border border-[#f97316]/30 flex items-center justify-center">
                <span className="text-[#f97316] text-xs font-bold uppercase">
                  {displayName[0]}
                </span>
              </div>
              <span className="text-white/70 text-sm">
                {user?.email ?? displayName}
              </span>
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="text-[#4a5c70] hover:text-white text-xs tracking-widest uppercase transition-colors border border-[#1e2d4a] hover:border-white/25 rounded px-3 py-1.5"
            >
              {t.dashboard.logout}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-[#f97316] text-sm font-semibold tracking-widest uppercase mb-1">
            {t.dashboard.welcome}
          </p>
          <h1 className="text-3xl font-extrabold text-white">
            {displayName}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {user?.email} · {user?.provider}
          </p>
        </div>

        {/* Stat cards */}
        <h2 className="text-white/50 text-xs tracking-widest uppercase mb-4">
          {t.dashboard.portfolioOverview}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            label={t.dashboard.totalBalance}
            value={formatRupiah(totalValue)}
            sub={locale === "id" ? "Portofolio simulasi" : "Simulated portfolio"}
          />
          <StatCard
            label={t.dashboard.totalReturn}
            value="+12.54%"
            sub={locale === "id" ? "Sejak bergabung" : "Since joining"}
            positive
          />
          <StatCard
            label={t.dashboard.openPositions}
            value={String(DUMMY_HOLDINGS.length)}
            sub={locale === "id" ? "Saham aktif" : "Active stocks"}
          />
        </div>

        {/* Holdings table */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/50 text-xs tracking-widest uppercase">
            {t.dashboard.holdings}
          </h2>
          <span className="text-[#4a5c70] text-[11px] italic">
            {t.dashboard.dummyNote}
          </span>
        </div>

        <div className="bg-[#111e35] border border-[#1e2d4a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2d4a]">
                {[
                  t.dashboard.stock,
                  t.dashboard.lot,
                  t.dashboard.price,
                  t.dashboard.value,
                  t.dashboard.change,
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[#4a5c70] text-[11px] tracking-widest uppercase px-5 py-3 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DUMMY_HOLDINGS.map((h, i) => {
                const value = h.lot * h.price * 100;
                const isPositive = h.change >= 0;
                return (
                  <tr
                    key={h.ticker}
                    className={`border-b border-[#1e2d4a]/50 hover:bg-white/[0.02] transition-colors ${
                      i === DUMMY_HOLDINGS.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="text-white font-bold">{h.ticker}</p>
                      <p className="text-[#4a5c70] text-xs">{h.name}</p>
                    </td>
                    <td className="px-5 py-4 text-white/80">{h.lot}</td>
                    <td className="px-5 py-4 text-white/80">
                      {formatRupiah(h.price)}
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">
                      {formatRupiah(value)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isPositive ? "text-[#22c55e]" : "text-red-400"
                        }`}
                      >
                        {isPositive ? "▲" : "▼"}{" "}
                        {Math.abs(h.change).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
