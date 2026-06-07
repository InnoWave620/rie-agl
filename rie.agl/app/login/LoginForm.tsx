'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// ── Stat card data ────────────────────────────────────────────────────────────
const STATS = [
  { value: '50%',   label: 'Faster Hiring' },
  { value: '23h',   label: 'Saved Per Hire' },
  { value: '$360K', label: 'Annual Savings' },
  { value: '100%',  label: 'POPIA Compliant' },
] as const;

export default function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') ?? '/employer';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Invalid credentials');
        setLoading(false);
        return;
      }
      router.push(from);
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ══════════════════ LEFT PANEL ══════════════════ */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0A0F24] to-[#001CB0] px-20 py-16">

        {/* Dot-grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Decorative blur orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#001CB0]/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 -left-16 w-64 h-64 rounded-full bg-[#E66423]/20 blur-3xl" />

        {/* ── Logo ── */}
        <div className="relative flex items-center gap-3.5 z-10">
          <img
            src="/AGL.logo.png"
            alt="AGL Logo"
            className="h-[48px] w-auto object-contain brightness-0 invert"
          />
          <div>
            <div className="text-white font-bold text-xl leading-tight tracking-wide">AGL</div>
            <div className="text-white/50 text-[11px] leading-tight tracking-widest uppercase">Recruitment Platform</div>
          </div>
        </div>

        {/* ── Headline + stats ── */}
        <div className="relative z-10 space-y-10">
          <div>
            <h1 className="text-[2.6rem] font-black text-white leading-tight mb-5 tracking-tight">
              Smarter hiring for<br />
              <span className="text-[#E66423]">Africa&apos;s largest</span><br />
              logistics network.
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">
              AI-powered CV screening and candidate ranking across 51 countries and 23,000+ employees.
            </p>
          </div>

          {/* 2×2 glass stat cards */}
          <div className="grid grid-cols-2 gap-5">
            {STATS.map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
              >
                <div className="text-4xl font-black text-[#E66423] mb-0.5">{stat.value}</div>
                <div className="text-sm text-white/55 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Copyright ── */}
        <p className="relative z-10 text-white/25 text-xs">
          © 2026 Africa Global Logistics. All rights reserved.
        </p>
      </div>

      {/* ══════════════════ RIGHT PANEL ══════════════════ */}
      <div className="flex flex-1 items-center justify-center bg-[#F4F6F9] p-6">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-[#001CB0]/8 p-10 transition-all duration-500 animate-[fadeSlideUp_0.45s_ease_both]">

            {/* Mobile logo */}
            <div className="flex items-center gap-3.5 mb-8 lg:hidden">
              <img
                src="/AGL.logo.png"
                alt="AGL Logo"
                className="h-[44px] w-auto object-contain"
              />
              <div>
                <div className="font-bold text-lg text-[#0A0F24] leading-tight">AGL</div>
                <div className="text-xs text-gray-400">Recruitment Platform</div>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-black text-[#0A0F24] mb-1 tracking-tight">Sign in</h2>
              <p className="text-sm text-gray-500">Access your employer dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0F24]/70 uppercase tracking-widest mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    id="email"
                    type="email"
                    className="w-full h-13 pl-12 pr-4 rounded-xl border border-gray-200 bg-[#F4F6F9] text-base text-[#0A0F24] placeholder-gray-400 outline-none transition focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/15 hover:border-gray-300"
                    placeholder="you@agl.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0F24]/70 uppercase tracking-widest mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    className="w-full h-13 pl-12 pr-11 rounded-xl border border-gray-200 bg-[#F4F6F9] text-base text-[#0A0F24] placeholder-gray-400 outline-none transition focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/15 hover:border-gray-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#001CB0] transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#001CB0] to-[#0033E0] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#001CB0]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#001CB0]/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-7 pt-6 text-center space-y-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-[#E66423] hover:underline transition-colors">
                  Create one
                </Link>
              </p>
              <Link
                href="/careers"
                className="inline-block text-xs font-medium text-gray-400 hover:text-[#001CB0] transition-colors"
              >
                ← View Public Portal
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-400/70 text-xs mt-5">
            Protected by TLS 1.3 · POPIA Compliant
          </p>
        </div>
      </div>

      {/* Keyframe animation via style tag */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
