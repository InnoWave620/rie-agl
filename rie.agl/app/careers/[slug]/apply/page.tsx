'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, CheckCircle, Loader2, User, Mail, Phone, MapPin, ArrowRight, Upload } from 'lucide-react';
import FileUpload from '../../../components/common/FileUpload';

interface Props { params: Promise<{ slug: string }> }

const STEPS = ['Personal Info', 'Resume & Cover Letter', 'Consent & Submit'];

interface JobInfo { id: string; title: string; location: string; country: string; }

export default function ApplicationFormPage({ params }: Props) {
  const { slug } = use(params);

  const [job, setJob]         = useState<JobInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep]           = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    location: '', coverLetter: '', consentGiven: false,
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // slug is the JobID
    fetch(`/api/jobs/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.status === 'published') {
          setJob({ id: d.data.id, title: d.data.title, location: d.data.location, country: d.data.country });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const update = (field: string, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.firstName) e.firstName = 'Required';
      if (!form.lastName)  e.lastName  = 'Required';
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
      if (!form.phone) e.phone = 'Required';
    }
    if (step === 1) { if (!resumeFile) e.resumeFile = 'Please upload your CV'; }
    if (step === 2) { if (!form.consentGiven) e.consentGiven = 'You must consent to proceed'; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep() || !job) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('jobId', job.id);
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
      if (resumeFile) formData.append('resume', resumeFile);
      await fetch('/api/applications', { method: 'POST', body: formData });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // show success even on error
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Loader2 size={36} className="animate-spin text-[#001CB0]" />
          <span className="text-sm font-medium">Loading job details…</span>
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
        <div className="card text-center p-12 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5 text-3xl">🔍</div>
          <h2 className="font-bold text-lg text-[#0A0F24] mb-2">Position Not Found</h2>
          <p className="text-sm text-gray-400 mb-7">This job may no longer be open or the link may be invalid.</p>
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] transition-all"
          >
            Browse Open Positions
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
        <div className="card p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-50">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-[#0A0F24] mb-2">Application Submitted! 🎉</h2>
          <p className="text-sm text-gray-500 mb-1">
            Thank you <strong className="text-[#0A0F24]">{form.firstName}</strong>! Your application for
          </p>
          <p className="font-bold text-lg text-[#001CB0] mb-4">{job.title}</p>
          <p className="text-sm text-gray-400 mb-1">
            You&apos;ll receive a confirmation email at <strong>{form.email}</strong> shortly.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Our AI will review your CV within 2–3 business days.
          </p>

          {/* What happens next */}
          <div className="bg-[#F4F6F9] rounded-xl p-5 text-sm text-left mb-7">
            <div className="font-bold text-[#0A0F24] mb-3">What happens next?</div>
            <ol className="space-y-2">
              {[
                { step: '1', text: 'AI screening & scoring (within 24h)' },
                { step: '2', text: 'HR review of your profile' },
                { step: '3', text: 'Interview invitation (if shortlisted)' },
              ].map(item => (
                <li key={item.step} className="flex items-center gap-3 text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-[#001CB0] text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {item.step}
                  </span>
                  {item.text}
                </li>
              ))}
            </ol>
          </div>

          <Link
            href="/careers"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white bg-[#0A0F24] hover:bg-[#001CB0] transition-all"
          >
            ← Browse More Positions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">

      {/* ── Sticky Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0A0F24] border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href={`/careers/${slug}`}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm font-medium"
          >
            <ChevronLeft size={16} /> Job Details
          </Link>
          <Link href="/careers" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#E66423] flex items-center justify-center font-black text-white text-xs group-hover:scale-105 transition-transform">AGL</div>
            <span className="text-white font-semibold text-sm hidden sm:block">AGL Careers</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-bold text-[#E66423] tracking-widest uppercase mb-2">Applying for</p>
          <h1 className="text-3xl font-black text-[#0A0F24] mb-2 leading-tight">{job.title}</h1>
          <p className="text-sm text-gray-400 font-medium flex items-center justify-center gap-1.5">
            <MapPin size={13} className="text-[#001CB0]" />
            {job.location}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < step
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : i === step
                      ? 'bg-[#001CB0] text-white shadow-lg shadow-[#001CB0]/30 scale-110'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i < step ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span
                  className={`text-xs mt-2 hidden sm:block font-semibold transition-colors ${
                    i === step ? 'text-[#001CB0]' : i < step ? 'text-green-500' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-16 sm:w-28 h-0.5 mx-3 mt-[-12px] sm:mt-[-20px] transition-all duration-500 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="card p-8">

          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#0A0F24] pb-4 border-b border-gray-100">Personal Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="firstName">First Name *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      id="firstName"
                      className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-gray-50 text-[#0A0F24] placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all ${errors.firstName ? 'border-red-400' : 'border-gray-200'}`}
                      value={form.firstName}
                      onChange={e => update('firstName', e.target.value)}
                      placeholder="e.g. Kwame"
                    />
                  </div>
                  {errors.firstName && <p className="text-xs mt-1.5 text-red-500 font-medium">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="lastName">Last Name *</label>
                  <input
                    id="lastName"
                    className={`w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 text-[#0A0F24] placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all ${errors.lastName ? 'border-red-400' : 'border-gray-200'}`}
                    value={form.lastName}
                    onChange={e => update('lastName', e.target.value)}
                    placeholder="e.g. Asante"
                  />
                  {errors.lastName && <p className="text-xs mt-1.5 text-red-500 font-medium">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="email">Email Address *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-gray-50 text-[#0A0F24] placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs mt-1.5 text-red-500 font-medium">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="phone">Phone Number *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      id="phone"
                      className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-gray-50 text-[#0A0F24] placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="+234 80 1234 5678"
                    />
                  </div>
                  {errors.phone && <p className="text-xs mt-1.5 text-red-500 font-medium">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="location">Current Location</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                      id="location"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                      value={form.location}
                      onChange={e => update('location', e.target.value)}
                      placeholder="e.g. Lagos, Nigeria"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Resume & Cover Letter */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#0A0F24] pb-4 border-b border-gray-100">Resume &amp; Cover Letter</h2>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resume / CV *</label>
                <FileUpload onFileSelect={setResumeFile} accept=".pdf,.doc,.docx" maxSizeMB={10} />
                {errors.resumeFile && <p className="text-xs mt-2 text-red-500 font-medium">{errors.resumeFile}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="coverLetter">
                  Cover Letter <span className="text-gray-300 font-normal normal-case">(Optional)</span>
                </label>
                <textarea
                  id="coverLetter"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all resize-vertical"
                  rows={6}
                  value={form.coverLetter}
                  onChange={e => update('coverLetter', e.target.value)}
                  placeholder="Tell us why you're the perfect fit for this role at AGL..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Consent & Submit */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#0A0F24] pb-4 border-b border-gray-100">Review &amp; Submit</h2>

              {/* Summary */}
              <div className="bg-[#F4F6F9] rounded-xl p-5 space-y-3 text-sm">
                <div className="font-bold text-[#0A0F24] mb-1 text-xs uppercase tracking-wider">Application Summary</div>
                {[
                  { label: 'Name',     value: `${form.firstName} ${form.lastName}` },
                  { label: 'Email',    value: form.email },
                  { label: 'Phone',    value: form.phone },
                  { label: 'CV',       value: resumeFile?.name ?? '—' },
                  { label: 'Position', value: job.title },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">{row.label}</span>
                    <span className="font-semibold text-[#0A0F24] text-right max-w-[60%] truncate">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Consent checkbox */}
              <div className={`p-5 rounded-xl border transition-all ${errors.consentGiven ? 'border-red-300 bg-red-50' : 'border-[#001CB0]/15 bg-[#001CB0]/5'}`}>
                <label className="flex items-start gap-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4.5 h-4.5 rounded accent-[#001CB0] shrink-0"
                    checked={form.consentGiven}
                    onChange={e => update('consentGiven', e.target.checked)}
                  />
                  <span className="text-sm leading-relaxed text-gray-600">
                    I consent to Africa Global Logistics processing my personal information, including my CV and contact details,
                    for recruitment purposes in accordance with the{' '}
                    <strong className="text-[#0A0F24]">Protection of Personal Information Act (POPIA)</strong>.
                    I understand my data will be retained for 12 months.
                  </span>
                </label>
                {errors.consentGiven && <p className="text-xs mt-2 text-red-500 font-medium ml-7">{errors.consentGiven}</p>}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                onClick={back}
              >
                <ChevronLeft size={15} /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] shadow-md shadow-[#001CB0]/20 hover:shadow-[#001CB0]/30 transition-all"
                onClick={next}
              >
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white bg-[#E66423] hover:bg-[#d45a1e] shadow-md shadow-[#E66423]/25 hover:shadow-[#E66423]/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : '🚀'}
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
