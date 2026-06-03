'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye, EyeOff, Lock, Mail, User, Building2,
  Loader2, CheckCircle, ShieldCheck,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'recruiter',  label: 'Recruiter' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'admin',      label: 'Administrator' },
] as const;

const DEPARTMENTS = [
  'Human Resources',
  'Port Operations',
  'Rail Operations',
  'Logistics',
  'IT',
  'Finance',
  'Legal',
  'Executive',
];

const FEATURES = [
  { icon: '🤖', text: 'AI-powered CV screening across 6 dimensions' },
  { icon: '📊', text: 'Real-time candidate pipeline management' },
  { icon: '🛡️', text: 'POPIA-compliant data handling' },
  { icon: '🌍', text: 'Multi-country talent sourcing' },
];

// ── Password strength helper ──────────────────────────────────────────────────
function pwStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-600'];
const STRENGTH_TEXT   = ['', 'text-red-500', 'text-amber-500', 'text-emerald-500', 'text-emerald-700'];

// ── Shared input class ────────────────────────────────────────────────────────
const INPUT_CLS =
  'w-full h-11 rounded-xl border border-gray-200 bg-[#F4F6F9] text-sm text-[#0A0F24] ' +
  'placeholder-gray-400 outline-none transition ' +
  'focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/15 hover:border-gray-300';

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName:   '',
    email:      '',
    password:   '',
    confirmPw:  '',
    role:       'recruiter',
    department: 'Human Resources',
  });

  const [showPw,   setShowPw]   = useState(false);
  const [showCpw,  setShowCpw]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const update = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const strength      = pwStrength(form.password);
  const strengthLabel = STRENGTH_LABELS[strength];
  const strengthColor = STRENGTH_COLORS[strength];
  const strengthText  = STRENGTH_TEXT[strength];

  const pwMismatch = !!form.confirmPw && form.password !== form.confirmPw;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim())        { setError('Full name is required'); return; }
    if (!form.email.trim())           { setError('Email is required'); return; }
    if (form.password.length < 8)     { setError('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPw) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName:   form.fullName.trim(),
          email:      form.email.trim(),
          password:   form.password,
          role:       form.role,
          department: form.department,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create account');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/employer'), 1800);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ══════════════════ LEFT PANEL ══════════════════ */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0A0F24] to-[#001CB0] p-16">

        {/* Dot-grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Blur orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#001CB0]/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 -left-16 w-64 h-64 rounded-full bg-[#E66423]/20 blur-3xl" />

        {/* ── Logo ── */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-11 h-11 rounded-xl bg-[#001CB0] border-2 border-white/20 flex items-center justify-center font-black text-white text-xl shadow-lg">
            A
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight tracking-wide">AGL</div>
            <div className="text-white/50 text-xs leading-tight tracking-widest uppercase">Recruitment Platform</div>
          </div>
        </div>

        {/* ── Headline + features ── */}
        <div className="relative z-10 space-y-10">
          <div>
            <h1 className="text-[2.6rem] font-black text-white leading-tight mb-5 tracking-tight">
              Join the team<br />
              <span className="text-[#E66423]">powering Africa&apos;s</span><br />
              talent pipeline.
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">
              Create your recruiter account and start managing candidates with AI-powered screening.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f.text} className="flex items-center gap-3 text-white/75 text-sm">
                <span className="text-base">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Copyright ── */}
        <p className="relative z-10 text-white/25 text-xs">
          © 2026 Africa Global Logistics. All rights reserved.
        </p>
      </div>

      {/* ══════════════════ RIGHT PANEL ══════════════════ */}
      <div className="flex flex-1 items-start justify-center bg-[#F4F6F9] p-6 overflow-y-auto">
        <div className="w-full max-w-md my-8">

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-[#001CB0]/8 p-10 transition-all duration-500 animate-[fadeSlideUp_0.45s_ease_both]">

            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-[#001CB0] flex items-center justify-center font-black text-white">
                A
              </div>
              <div>
                <div className="font-bold text-[#0A0F24]">AGL</div>
                <div className="text-xs text-gray-400">Recruitment Platform</div>
              </div>
            </div>

            {/* ── Success state ── */}
            {success ? (
              <div className="text-center py-10 animate-[fadeSlideUp_0.4s_ease_both]">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-6 animate-[scaleIn_0.35s_cubic-bezier(0.175,0.885,0.32,1.275)_both]">
                  <CheckCircle size={36} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-[#0A0F24] mb-2">Account Created!</h2>
                <p className="text-sm text-gray-500">Redirecting to your dashboard…</p>
                <div className="mt-6 flex justify-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#001CB0] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Heading */}
                <div className="mb-7">
                  <h2 className="text-3xl font-black text-[#0A0F24] mb-1 tracking-tight">Create account</h2>
                  <p className="text-sm text-gray-500">Join the AGL recruitment team</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F24]/70 uppercase tracking-widest mb-1.5" htmlFor="fullName">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        id="fullName" type="text"
                        className={`${INPUT_CLS} pl-10 pr-4`}
                        placeholder="e.g. Jane Doe"
                        value={form.fullName}
                        onChange={e => update('fullName', e.target.value)}
                        required autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F24]/70 uppercase tracking-widest mb-1.5" htmlFor="email">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        id="email" type="email"
                        className={`${INPUT_CLS} pl-10 pr-4`}
                        placeholder="you@agl.com"
                        value={form.email}
                        onChange={e => update('email', e.target.value)}
                        required autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Role + Department */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0A0F24]/70 uppercase tracking-widest mb-1.5" htmlFor="role">
                        Role *
                      </label>
                      <select
                        id="role"
                        className={`${INPUT_CLS} px-3`}
                        value={form.role}
                        onChange={e => update('role', e.target.value)}
                      >
                        {ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0A0F24]/70 uppercase tracking-widest mb-1.5" htmlFor="department">
                        Department
                      </label>
                      <div className="relative">
                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                          id="department"
                          className={`${INPUT_CLS} pl-9 pr-3`}
                          value={form.department}
                          onChange={e => update('department', e.target.value)}
                        >
                          {DEPARTMENTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F24]/70 uppercase tracking-widest mb-1.5" htmlFor="password">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        className={`${INPUT_CLS} pl-10 pr-11`}
                        placeholder="Min. 8 characters"
                        value={form.password}
                        onChange={e => update('password', e.target.value)}
                        required autoComplete="new-password"
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

                    {/* Strength bar */}
                    {form.password.length > 0 && (
                      <div className="mt-2.5">
                        <div className="flex gap-1 mb-1.5">
                          {[1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                i <= strength ? strengthColor : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${strengthText}`}>
                          {strengthLabel}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0A0F24]/70 uppercase tracking-widest mb-1.5" htmlFor="confirmPw">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        id="confirmPw"
                        type={showCpw ? 'text' : 'password'}
                        className={`${INPUT_CLS} pl-10 pr-11 ${pwMismatch ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                        placeholder="Re-enter your password"
                        value={form.confirmPw}
                        onChange={e => update('confirmPw', e.target.value)}
                        required autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCpw(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#001CB0] transition-colors"
                        aria-label={showCpw ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {pwMismatch && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span>⚠</span> Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* Error box */}
                  {error && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                      <span className="mt-0.5">⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#001CB0] to-[#0033E0] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#001CB0]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#001CB0]/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-7 pt-6 text-center border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-[#E66423] hover:underline transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* TLS badge */}
          <p className="flex items-center justify-center gap-1.5 text-gray-400/70 text-xs mt-5">
            <ShieldCheck size={12} />
            Protected by TLS 1.3 · POPIA Compliant
          </p>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}
