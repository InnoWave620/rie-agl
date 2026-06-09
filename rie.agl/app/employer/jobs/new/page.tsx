'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../../components/layout/Header';
import { ArrowLeft, Save, Eye, Loader2, Sparkles, CheckCircle, UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
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

  // AI Extraction State
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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

  const handleFileChange = async (file: File) => {
    if (!file) return;
    
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setParseError('Unsupported file type. Please upload a PDF or Word document (.docx).');
      setParseSuccess(false);
      return;
    }

    setParsing(true);
    setParseError(null);
    setParseSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/jobs/parse-spec', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse the document.');
      }

      const extracted = data.data;
      
      setForm({
        title: extracted.title || '',
        summary: extracted.summary || '',
        description: extracted.description || '',
        division: (extracted.division || 'Port') as Division,
        region: (extracted.region || 'West Africa') as Region,
        location: extracted.location || '',
        country: extracted.country || '',
        employmentType: (extracted.employmentType || 'full_time') as EmploymentType,
        experienceLevel: (extracted.experienceLevel || 'Mid') as ExperienceLevel,
        closingDate: '',
        requirements: extracted.requirements || '',
      });

      setParseSuccess(true);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'An error occurred while parsing the file. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

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

          <div className="p-6 space-y-6">
            {/* AI Document Upload Section */}
            <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-6 overflow-hidden relative transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#001CB0]/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-[#001CB0]" size={18} />
                    <h2 className="text-base font-bold text-[#0A0F24]">AI Job Spec Extractor</h2>
                    <span className="bg-[#001CB0]/10 text-[#001CB0] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      AI Powered
                    </span>
                  </div>
                  <p className="text-xs text-[#535E75] mt-1">
                    Upload a Word document (.docx) or PDF job spec to automatically pre-fill details, requirements, and settings.
                  </p>
                </div>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-[#001CB0] bg-[#001CB0]/5 scale-[1.01] shadow-sm'
                    : 'border-[#E2E6EF] hover:border-[#001CB0] hover:bg-[#F8FAFC]'
                }`}
              >
                <input
                  type="file"
                  id="job-spec-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  accept=".pdf,.docx"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                  disabled={parsing}
                />

                {parsing ? (
                  <div className="space-y-3 py-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <Loader2 className="animate-spin text-[#001CB0]" size={36} />
                        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0025E0] animate-pulse" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0A0F24]">AI is Analyzing Your Document...</h4>
                      <p className="text-xs text-[#535E75] mt-1">Extracting job details, requirements, and formatting the description...</p>
                    </div>
                  </div>
                ) : parseSuccess ? (
                  <div className="space-y-3 py-2">
                    <div className="flex justify-center">
                      <div className="bg-green-50 p-2.5 rounded-full border border-green-200 text-green-600">
                        <CheckCircle size={24} className="animate-bounce" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-green-700">Form Auto-filled Successfully!</h4>
                      <p className="text-xs text-green-600/90 mt-1">Title, description, requirements, and settings have been populated. Please review below.</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setParseSuccess(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#535E75] hover:text-[#0A0F24] font-semibold mt-2 px-3 py-1.5 rounded-lg border border-[#E2E6EF] bg-white hover:bg-gray-50 transition-colors pointer-events-auto relative z-10"
                    >
                      Clear Success State
                    </button>
                  </div>
                ) : parseError ? (
                  <div className="space-y-3 py-2">
                    <div className="flex justify-center">
                      <div className="bg-red-50 p-2.5 rounded-full border border-red-200 text-red-600">
                        <AlertCircle size={24} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-red-700">Extraction Failed</h4>
                      <p className="text-xs text-red-600/90 mt-1">{parseError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setParseError(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#535E75] hover:text-[#0A0F24] font-semibold mt-2 px-3 py-1.5 rounded-lg border border-[#E2E6EF] bg-white hover:bg-gray-50 transition-colors pointer-events-auto relative z-10"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="bg-[#001CB0]/5 p-3 rounded-full border border-[#001CB0]/10 text-[#001CB0]">
                        <UploadCloud size={24} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0A0F24]">
                        Drag &amp; drop job specification file, or <span className="text-[#001CB0] hover:underline decoration-2 font-semibold">browse</span>
                      </h4>
                      <p className="text-xs text-[#535E75] mt-1">Supports PDF and Word Document (.docx) up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#edc047] text-[#1b365f] text-sm font-bold shadow-sm hover:bg-[#e0b236] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
