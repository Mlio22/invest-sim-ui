"use client";

import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";
import KapitaLogo from "./KapitaLogo";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8888";

// ── OAuth provider icons ──────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.25 2.25h6.016l4.26 5.632L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const oauthLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_BASE}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? "Login failed. Please try again.");
        return;
      }
      const token = data?.token ?? data?.access_token ?? data?.data?.token;
      if (token) {
        localStorage.setItem("kapita-token", token);
        window.location.href = "/dashboard";
      } else {
        setError("Login failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const oauthProviders = [
    { key: "google", label: t.login.googleBtn, icon: <GoogleIcon /> },
    { key: "microsoft", label: t.login.microsoftBtn, icon: <MicrosoftIcon /> },
    { key: "facebook", label: t.login.facebookBtn, icon: <FacebookIcon /> },
    { key: "twitter", label: t.login.twitterBtn, icon: <XIcon />, dark: true },
  ];

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 lg:px-14 max-w-lg mx-auto w-full">
      {/* Mobile logo */}
      <div className="mb-10 lg:hidden">
        <KapitaLogo />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2">
          {t.login.title}
          <br />
          <span className="text-[#f97316]">{t.login.appName}</span>
        </h1>
        <p className="text-white/55 text-base">{t.login.subtitle}</p>
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-5">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={t.login.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#0b1326] border border-[#1e2d4a] focus:border-[#f97316]/60 focus:outline-none text-white placeholder-[#4a5c70] rounded-lg px-4 py-3 text-sm transition-colors"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder={t.login.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0b1326] border border-[#1e2d4a] focus:border-[#f97316]/60 focus:outline-none text-white placeholder-[#4a5c70] rounded-lg px-4 py-3 pr-11 text-sm transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5c70] hover:text-white/70 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs pt-1">{error}</p>
        )}

        <div className="flex items-center justify-end">
          <a href="#" className="text-[#4a5c70] hover:text-white/60 text-xs transition-colors">
            {t.login.forgotPassword}
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#f97316] hover:bg-[#ea6c0a] active:bg-[#dc5f00] disabled:opacity-60 text-white font-bold text-sm rounded-lg py-3.5 transition-colors"
        >
          {loading ? "…" : t.login.signInBtn}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#1e2d4a]" />
        <span className="text-[#4a5c70] text-[11px] tracking-widest uppercase">
          {t.login.orWith}
        </span>
        <div className="flex-1 h-px bg-[#1e2d4a]" />
      </div>

      {/* OAuth buttons — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {oauthProviders.map(({ key, label, icon, dark }) => (
          <button
            key={key}
            type="button"
            onClick={() => oauthLogin(key)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-sm font-semibold transition-colors ${
              dark
                ? "bg-[#111e35] border border-[#1e2d4a] hover:border-white/20 text-white"
                : "bg-white hover:bg-gray-50 text-gray-800"
            }`}
          >
            {icon}
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* Register link */}
      <p className="text-center text-white/55 text-sm">
        {t.login.noAccount}{" "}
        <Link href="/register" className="text-[#f97316] font-bold hover:underline">
          {t.login.joinFloor}
        </Link>
      </p>

      {/* Footer */}
      <div className="flex items-center justify-center gap-5 mt-auto pt-10">
        {[t.common.privacyPolicy, t.common.terms, t.common.support].map((item) => (
          <a
            key={item}
            href="#"
            className="text-[#4a5c70] text-[10px] tracking-[0.1em] hover:text-white/50 transition-colors"
          >
            {item}
          </a>
        ))}
      </div>
    </div>
  );
}
