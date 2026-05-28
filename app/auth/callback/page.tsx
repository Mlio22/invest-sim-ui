"use client";

import { useI18n } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TOKEN_KEY = "kapita-token";

function extractToken(): string | null {
  // Check query params (?token=, ?access_token=, ?id_token=)
  const query = new URLSearchParams(window.location.search);
  const fromQuery =
    query.get("token") ||
    query.get("access_token") ||
    query.get("id_token") ||
    // fallback: any value that looks like a JWT
    Array.from(query.values()).find((v) => v.startsWith("eyJ"));

  if (fromQuery) return fromQuery;

  // Check URL hash fragments (#token=, #access_token=)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (
    hash.get("token") ||
    hash.get("access_token") ||
    hash.get("id_token") ||
    Array.from(hash.values()).find((v) => v.startsWith("eyJ")) ||
    null
  );
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check for explicit OAuth error
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      const desc = params.get("error_description") ?? oauthError;
      setErrorMsg(desc);
      setStatus("error");
      return;
    }

    const token = extractToken();

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      router.replace("/dashboard");
    } else {
      setStatus("error");
      setErrorMsg(t.callback.error);
    }
  }, [router, t.callback.error]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b1326] px-8">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-5">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg mb-2">
            {t.callback.error}
          </p>
          {errorMsg && (
            <p className="text-white/50 text-sm mb-6">{errorMsg}</p>
          )}
          <a
            href="/login"
            className="inline-block bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold text-sm px-6 py-3 rounded-lg transition-colors"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b1326] px-8">
      <div className="text-center">
        {/* Spinner */}
        <div className="w-12 h-12 rounded-full border-2 border-[#1e2d4a] border-t-[#f97316] animate-spin mx-auto mb-5" />
        <p className="text-white font-semibold text-lg mb-1">
          {t.callback.completing}
        </p>
        <p className="text-white/50 text-sm">{t.callback.pleaseWait}</p>
      </div>
    </div>
  );
}
