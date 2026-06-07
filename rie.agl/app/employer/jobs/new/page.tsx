'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/layout/Header';
import { ArrowLeft, Save, Eye, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import type { Division, Region, EmploymentType, ExperienceLevel } from '../../../types';
import { generateSlug } from '../../../lib/utils';

const DIVISIONS: Division[] = ['Port', 'Rail', 'Logistics'];
const REGIONS: Region[] = ['West Africa', 'East Africa', 'Southern Africa', 'Central Africa', 'North Africa'];
const EMP_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];
const EXP_LEVELS: ExperienceLevel[] = ['Entry', 'Mid', 'Senior', 'Executive'];

const fieldClass = "w-full bg-white border border-[#E2E6EF] rounded-xl px-4 py-2.5 text-sm text-[#0A0F24] placeholder:text-[#535E75] focus:outline-none focus:ring-2 focus:ring-[#001CB0]/20 focus:border-[#001CB0] transition-all duration-200";
const labelClass = "block text-xs font-semibold text-[#535E75] uppercase tracking-wider mb-1.5";

export default function NewJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    title: '',
    summary: '',
    description: '',
    division: 'Port' as Division,
    region: 'West Africa' as Region,
    location: '',
    country: '',
    employmentType: 'full_time' as EmploymentType,
    experienceLevel: 'Mid' as ExperienceLevel,
    closingDate: '',
    requirements: '',
  });

  const update = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  async function handleSave(status: 'draft' | 'published') {
    setSaving(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => router.push('/employer/jobs'), 1000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-[#E2E6EF] px-6 py-4">
        <div className="max-w-[1400px] mx-auto w-full flex items-center gap-4">
          <Link
            href="/employer/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-[#535E75] hover:text-[#001CB0] font-medium transition-colors duration-200"
          >
            <ArrowLeft size={15} />
            Back to Jobs
          </Link>
          <div className="h-5 w-px bg-[#E2E6EF]" />
          <div>
            <h1 className="text-xl font-bold text-[#0A0F24]">Create Job Posting</h1>
            <p className="text-sm text-[#535E75] mt-0.5">Fill in the details to post a new position</p>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-[#F4F6F9]">
        <div className="max-w-[1400px] mx-auto w-full">
          {/* Success Banner */}
          {saved && (
            <div className="mx-6 mt-6 p-4 rounded-2xl bg-green-50 border border-green-200 flex items-center gap-3 animate-scale-in">
              <CheckCircle size={18} className="text-green-600 shrink-0" />
              <span className="text-sm font-semibold text-green-700">Job saved successfully! Redirecting…</span>
            </div>
          )}

          <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Main Form (left 2/3) ── */}
            <div className="xl:col-span-2 space-y-6">

              {/* Basic Information */}
              <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm">
                <div className="px-6 py-4 border-b border-[#E2E6EF]">
                  <h2 className="text-base font-bold text-[#0A0F24]">Basic Information</h2>
                  <p className="text-xs text-[#535E75] mt-0.5">Core details visible to candidates</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className={labelClass} htmlFor="title">Job Title *</label>
                    <input
                      id="title"
                      className={fieldClass}
                      placeholder="e.g. Port Operations Manager"
                      value={form.title}
                      onChange={e => update('title', e.target.value)}
                    />
                    {form.title && (
                      <p className="text-xs mt-1.5 text-[#535E75]">
                        Slug: <span className="font-mono text-[#001CB0]">/careers/{generateSlug(form.title)}-{form.location.toLowerCase().replace(/\s+/g, '-') || 'location'}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="summary">Short Summary *</label>
                    <textarea
                      id="summary"
                      className={fieldClass}
                      rows={2}
                      placeholder="Brief one-sentence description shown on the job card..."
                      value={form.summary}
                      onChange={e => update('summary', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="description">Full Job Description *</label>
                    <textarea
                      id="description"
                      className={`${fieldClass} resize-y`}
                      rows={12}
                      placeholder="Write the full job description here. HTML is supported for rich formatting..."
                      value={form.description}
                      onChange={e => update('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm">
                <div className="px-6 py-4 border-b border-[#E2E6EF]">
                  <h2 className="text-base font-bold text-[#0A0F24]">Requirements</h2>
                  <p className="text-xs text-[#535E75] mt-0.5">Used by the AI to score incoming CVs</p>
                </div>
                <div className="p-6">
                  <label className={labelClass}>Essential Requirements</label>
                  <textarea
                    className={`${fieldClass} resize-y`}
                    rows={7}
                    placeholder={`Enter each requirement on a new line:\n• 5+ years in port operations\n• IMDG certification\n• Team leadership experience`}
                    value={form.requirements}
                    onChange={e => update('requirements', e.target.value)}
                  />
                  <p className="text-xs mt-2 text-[#535E75]">
                    Each line becomes a bullet point requirement on the job page.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Sidebar (right 1/3) ── */}
            <div className="space-y-5">

              {/* Job Settings */}
              <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm">
                <div className="px-5 py-4 border-b border-[#E2E6EF]">
                  <h2 className="text-base font-bold text-[#0A0F24]">Job Settings</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelClass}>Division *</label>
                    <select className={fieldClass} value={form.division} onChange={e => update('division', e.target.value)}>
                      {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Region *</label>
                    <select className={fieldClass} value={form.region} onChange={e => update('region', e.target.value)}>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>City *</label>
                      <input className={fieldClass} placeholder="Lagos" value={form.location} onChange={e => update('location', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Country *</label>
                      <input className={fieldClass} placeholder="Nigeria" value={form.country} onChange={e => update('country', e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Employment Type *</label>
                    <select className={fieldClass} value={form.employmentType} onChange={e => update('employmentType', e.target.value)}>
                      {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Experience Level *</label>
                    <select className={fieldClass} value={form.experienceLevel} onChange={e => update('experienceLevel', e.target.value)}>
                      {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Closing Date</label>
                    <input
                      type="date"
                      className={fieldClass}
                      value={form.closingDate}
                      onChange={e => update('closingDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Publish Actions */}
              <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-5 space-y-3">
                <button
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#001CB0] to-[#0025E0] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:opacity-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleSave('published')}
                  disabled={saving || !form.title || !form.description}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                  Publish Job
                </button>
                <button
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E6EF] text-[#0A0F24] text-sm font-semibold bg-white hover:bg-[#F4F6F9] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                >
                  <Save size={15} />
                  Save as Draft
                </button>
              </div>

              {/* AI Scoring Banner */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-[#001CB0]/5 to-[#0025E0]/10 border border-[#001CB0]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={15} className="text-[#001CB0]" />
                  <span className="text-sm font-bold text-[#001CB0]">AI Scoring Active</span>
                </div>
                <p className="text-xs leading-relaxed text-[#535E75]">
                  When you publish, all incoming CVs will be automatically scored across six dimensions using the job requirements you've entered.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
