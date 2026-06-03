'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../../components/layout/Header';
import { ArrowLeft, Save, Eye, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import type { Division, Region, EmploymentType, ExperienceLevel } from '../../../../types';

interface Props { params: Promise<{ id: string }> }

const DIVISIONS: Division[]     = ['Port', 'Rail', 'Logistics'];
const REGIONS: Region[]         = ['West Africa', 'East Africa', 'Southern Africa', 'Central Africa', 'North Africa'];
const EMP_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'full_time',  label: 'Full Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];
const EXP_LEVELS: ExperienceLevel[] = ['Entry', 'Mid', 'Senior', 'Executive'];

const fieldClass = "w-full bg-white border border-[#E2E6EF] rounded-xl px-4 py-2.5 text-sm text-[#0A0F24] placeholder:text-[#535E75] focus:outline-none focus:ring-2 focus:ring-[#001CB0]/20 focus:border-[#001CB0] transition-all duration-200";
const labelClass = "block text-xs font-semibold text-[#535E75] uppercase tracking-wider mb-1.5";

export default function EditJobPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    title:           '',
    summary:         '',
    description:     '',
    requirements:    '',
    division:        'Port' as Division,
    region:          'West Africa' as Region,
    location:        '',
    country:         '',
    employmentType:  'full_time' as EmploymentType,
    experienceLevel: 'Mid' as ExperienceLevel,
    salaryMin:       '',
    salaryMax:       '',
  });

  // Load existing job data
  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setNotFound(true); return; }
        const j = d.data;

        // Parse requirements array back to newline-separated text
        const reqText = Array.isArray(j.requirements)
          ? j.requirements.flatMap((r: { items: string[] }) => r.items).join('\n')
          : (j.requirements ?? '');

        // Split location → city + country
        const locParts = (j.location ?? '').split(',').map((s: string) => s.trim());

        setForm({
          title:           j.title ?? '',
          summary:         j.summary ?? '',
          description:     j.description ?? '',
          requirements:    reqText,
          division:        (j.division as Division) ?? 'Logistics',
          region:          (j.region as Region)   ?? 'West Africa',
          location:        locParts[0] ?? j.location ?? '',
          country:         locParts[1] ?? '',
          employmentType:  (j.employmentType as EmploymentType) ?? 'full_time',
          experienceLevel: (j.experienceLevel as ExperienceLevel) ?? 'Mid',
          salaryMin:       j.salaryMin != null ? String(j.salaryMin) : '',
          salaryMax:       j.salaryMax != null ? String(j.salaryMax) : '',
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  async function handleSave(status: 'draft' | 'published') {
    if (!form.title.trim()) {
      setToast({ type: 'error', msg: 'Job title is required.' });
      return;
    }
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:          form.title,
          division:       form.division,
          location:       form.location,
          country:        form.country,
          employmentType: form.employmentType,
          description:    form.description,
          requirements:   form.requirements,
          status,
          salaryMin:      form.salaryMin || null,
          salaryMax:      form.salaryMax || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', msg: 'Job saved successfully!' });
        setTimeout(() => router.push(`/employer/jobs/${id}`), 1200);
      } else {
        setToast({ type: 'error', msg: data.error ?? 'Failed to save job.' });
      }
    } catch {
      setToast({ type: 'error', msg: 'Network error — please try again.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <div className="bg-white border-b border-[#E2E6EF] px-6 py-4">
          <h1 className="text-xl font-bold text-[#0A0F24]">Edit Job</h1>
          <p className="text-sm text-[#535E75] mt-0.5">Loading…</p>
        </div>
        <main className="flex-1 p-6 bg-[#F4F6F9]">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {[200, 300, 180].map((h, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-6 animate-pulse">
                  <div className="h-4 bg-[#E2E6EF] rounded-lg w-1/3 mb-5" />
                  <div className="space-y-4">
                    <div className="h-10 bg-[#E2E6EF] rounded-xl" />
                    <div className="h-10 bg-[#E2E6EF] rounded-xl" />
                    <div style={{ height: h }} className="bg-[#E2E6EF] rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-5 animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-[#E2E6EF] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <div className="bg-white border-b border-[#E2E6EF] px-6 py-4">
          <h1 className="text-xl font-bold text-[#0A0F24]">Not Found</h1>
        </div>
        <main className="flex-1 flex items-center justify-center bg-[#F4F6F9]">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#F4F6F9] border border-[#E2E6EF] flex items-center justify-center mx-auto mb-4 text-3xl">❌</div>
            <h3 className="text-lg font-bold text-[#0A0F24] mb-2">Job not found</h3>
            <Link
              href="/employer/jobs"
              className="inline-flex items-center gap-2 px-4 py-2.5 mt-3 rounded-xl bg-gradient-to-r from-[#001CB0] to-[#0025E0] text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-all duration-200"
            >
              Back to Jobs
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-[#E2E6EF] px-6 py-4 flex items-center gap-4">
        <Link
          href={`/employer/jobs/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#535E75] hover:text-[#001CB0] font-medium transition-colors duration-200"
        >
          <ArrowLeft size={15} />
          Back to Job
        </Link>
        <div className="h-5 w-px bg-[#E2E6EF]" />
        <div>
          <h1 className="text-xl font-bold text-[#0A0F24] truncate max-w-md">
            Edit: {form.title || 'Job'}
          </h1>
          <p className="text-sm text-[#535E75] mt-0.5">Update the job posting details</p>
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-[#F4F6F9]">
        {/* Toast */}
        {toast && (
          <div className={`mx-6 mt-6 p-4 rounded-2xl flex items-center gap-3 animate-scale-in ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle size={16} className="text-green-600 shrink-0" />
              : <AlertCircle size={16} className="text-red-500 shrink-0" />}
            <span className={`text-sm font-semibold ${toast.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {toast.msg}
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Main Form ── */}
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
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="summary">Short Summary</label>
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
                  <p className="text-xs mt-2 text-[#535E75]">Each line becomes a bullet point requirement.</p>
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
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
                      <label className={labelClass}>City</label>
                      <input className={fieldClass} placeholder="Lagos"
                        value={form.location} onChange={e => update('location', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <input className={fieldClass} placeholder="Nigeria"
                        value={form.country} onChange={e => update('country', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Employment Type *</label>
                    <select className={fieldClass} value={form.employmentType} onChange={e => update('employmentType', e.target.value)}>
                      {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Experience Level</label>
                    <select className={fieldClass} value={form.experienceLevel} onChange={e => update('experienceLevel', e.target.value)}>
                      {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Salary Min</label>
                      <input type="number" className={fieldClass} placeholder="0"
                        value={form.salaryMin} onChange={e => update('salaryMin', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Salary Max</label>
                      <input type="number" className={fieldClass} placeholder="0"
                        value={form.salaryMax} onChange={e => update('salaryMax', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Actions */}
              <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-5 space-y-3">
                <button
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#001CB0] to-[#0025E0] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:opacity-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleSave('published')}
                  disabled={saving || !form.title}
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
                <Link
                  href={`/employer/jobs/${id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-[#535E75] text-sm font-medium hover:bg-[#F4F6F9] transition-all duration-200"
                >
                  Cancel
                </Link>
              </div>

              {/* AI Reminder */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-[#001CB0]/5 to-[#0025E0]/10 border border-[#001CB0]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={15} className="text-[#001CB0]" />
                  <span className="text-sm font-bold text-[#001CB0]">AI Scoring Active</span>
                </div>
                <p className="text-xs leading-relaxed text-[#535E75]">
                  Changes to requirements will affect how the AI scores future applications for this role.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
