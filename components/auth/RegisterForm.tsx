"use client";

import Link from "next/link";
import { useState } from "react";
import KapitaLogo from "./KapitaLogo";
import {
    EyeIcon,
    EyeOffIcon,
    FacebookIcon,
    UserPlusIcon,
    XIcon,
} from "./icons";

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex flex-col min-h-screen px-8 py-12 lg:px-14 max-w-lg mx-auto w-full">
      {/* Mobile logo */}
      <div className="mb-10 lg:hidden">
        <KapitaLogo />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3">
          Join the
          <br />
          Floor
        </h1>
        <p className="text-white/55 text-base">
          Create your account and start competing globally.
        </p>
      </div>

      {/* Form */}
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()} noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block mb-2 text-[#8899aa] text-[11px] tracking-[0.12em] uppercase font-semibold"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your trading name"
            autoComplete="name"
            required
            className="w-full bg-[#111e35] border border-[#1e2d4a] focus:border-[#f97316] rounded px-4 py-3 text-white placeholder:text-[#3a4e62] outline-none transition-colors text-sm"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="reg-email"
            className="block mb-2 text-[#8899aa] text-[11px] tracking-[0.12em] uppercase font-semibold"
          >
            Email Address
          </label>
          <input
            id="reg-email"
            type="email"
            placeholder="trader@kapita.io"
            autoComplete="email"
            required
            className="w-full bg-[#111e35] border border-[#1e2d4a] focus:border-[#f97316] rounded px-4 py-3 text-white placeholder:text-[#3a4e62] outline-none transition-colors text-sm"
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="reg-password"
            className="block mb-2 text-[#8899aa] text-[11px] tracking-[0.12em] uppercase font-semibold"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="w-full bg-[#111e35] border border-[#1e2d4a] focus:border-[#f97316] rounded px-4 py-3 pr-12 text-white placeholder:text-[#3a4e62] outline-none transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5c70] hover:text-white/70 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm-password"
            className="block mb-2 text-[#8899aa] text-[11px] tracking-[0.12em] uppercase font-semibold"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="w-full bg-[#111e35] border border-[#1e2d4a] focus:border-[#f97316] rounded px-4 py-3 pr-12 text-white placeholder:text-[#3a4e62] outline-none transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5c70] hover:text-white/70 transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            className="w-4 h-4 mt-0.5 cursor-pointer accent-[#f97316] flex-shrink-0"
          />
          <span className="text-white/60 text-sm leading-relaxed">
            I agree to the{" "}
            <a href="/terms" className="text-[#f97316] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-[#f97316] hover:underline">
              Privacy Policy
            </a>
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-[#f97316] hover:bg-[#ea6c0a] active:bg-[#d4600a] rounded py-4 font-bold text-sm tracking-[0.1em] uppercase text-white flex items-center justify-center gap-3 transition-colors"
        >
          Join the Floor
          <UserPlusIcon />
        </button>
      </form>

      {/* Social divider */}
      <div className="flex items-center gap-4 my-7">
        <div className="flex-1 h-px bg-[#1e2d4a]" />
        <span className="text-[#4a5c70] text-[10px] tracking-[0.18em] font-medium">
          OR CONNECT VIA
        </span>
        <div className="flex-1 h-px bg-[#1e2d4a]" />
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          className="border border-[#1e2d4a] hover:border-white/25 rounded py-3 flex items-center justify-center text-white font-bold tracking-[0.2em] text-[11px] transition-colors"
        >
          GOOGLE
        </button>
        <button
          type="button"
          className="border border-[#1e2d4a] hover:border-white/25 bg-black rounded py-3 flex items-center justify-center transition-colors"
          aria-label="Sign up with X"
        >
          <XIcon />
        </button>
        <button
          type="button"
          className="border border-[#1e2d4a] hover:border-white/25 bg-[#1877f2] rounded py-3 flex items-center justify-center transition-colors"
          aria-label="Sign up with Facebook"
        >
          <FacebookIcon />
        </button>
      </div>

      {/* Login link */}
      <p className="text-center mt-7 text-white/55 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-[#f97316] font-bold hover:underline">
          LOG IN
        </Link>
      </p>

      {/* Footer */}
      <div className="flex items-center justify-center gap-5 mt-auto pt-10">
        {["PRIVACY POLICY", "TERMS OF SERVICE", "SUPPORT"].map((item) => (
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
