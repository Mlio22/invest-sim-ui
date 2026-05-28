"use client";

import { useI18n } from "@/lib/i18n/context";
import React from "react";
import KapitaLogo from "./KapitaLogo";

interface Props {
  children: React.ReactNode;
}

export default function AuthPageLayout({ children }: Props) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex bg-[#0b1326]">
      {/* ── Left hero panel — desktop only ── */}
      <aside className="hidden lg:flex lg:w-1/2 sticky top-0 h-screen flex-col overflow-hidden relative">
        {/* Background trading floor image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1280&q=80)",
          }}
        />
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(11,19,38,0.55) 0%, rgba(11,19,38,0.88) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <KapitaLogo />

          {/* Hero text — pinned to bottom */}
          <div className="mt-auto">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 border border-[#f97316]/50 rounded-full px-3 py-1 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] inline-block" />
              <span className="text-[#f97316] text-[11px] tracking-[0.15em] font-semibold">
                {t.hero.badge}
              </span>
            </div>

            <h2
              className="font-extrabold leading-[1.1] mb-6"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3.2rem)" }}
            >
              <span className="text-white">{t.hero.h1} </span>
              <span className="text-[#f97316]">{t.hero.h2}</span>
              <br />
              <span className="text-white">{t.hero.h3} </span>
              <span className="text-[#f97316]">{t.hero.h4}</span>
            </h2>

            <p
              className="leading-relaxed max-w-[340px]"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              {t.hero.subtitle}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#0d1829]">
        {children}
      </main>
    </div>
  );
}
