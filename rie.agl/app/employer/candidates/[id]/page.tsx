'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '../../../components/layout/Header';
import { ScoreBadge, StatusBadge, DivisionBadge } from '../../../components/common/StatusBadge';
import { formatRelativeTime } from '../../../lib/utils';
import {
  ArrowLeft, Download, Mail, Phone, MapPin,
  ThumbsUp, ThumbsDown, RefreshCw, Send, Calendar,
  CheckCircle, X, Loader2, Sparkles, FileText, StickyNote, User, BrainCircuit,
} from 'lucide-react';
import type { ApplicationStatus, DecisionCategory, Division } from '../../../types';

interface Props { params: Promise<{ id: string }> }

interface CandidateApp {
  id: string;
  jobId: string;
  jobTitle: string;
  status: ApplicationStatus;
  atsScore?: number;
  decisionCategory?: DecisionCategory;
  recommendation?: string;
  aiSummary?: string;
  strengths?: string;
  weaknesses?: string;
  createdAt: string;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  createdAt: string;
  applications: CandidateApp[];
}

export default function CandidateProfilePage({ params }: Props) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const appId = searchParams.get('appId');

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  const [activeTab, setActiveTab]   = useState<'overview' | 'ai-analysis' | 'notes'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteDate, setInviteDate] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [invited, setInvited] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`/api/candidates/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setCandidate(d.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header title="Loading…" subtitle="Fetching candidate profile" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-gray-400">
            <Loader2 size={32} className="animate-spin text-[#001CB0]" />
            <span className="text-sm font-medium">Loading candidate profile…</span>
          </div>
        </main>
      </>
    );
  }

  if (notFound || !candidate) {
    return (
      <>
        <Header title="Not Found" subtitle="" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5 text-gray-400">
              <User size={40} />
            </div>
            <h3 className="font-bold text-xl text-[#0A0F24] mb-2">Candidate not found</h3>
            <Link href="/employer/jobs" className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] transition-all">
              Back to Jobs
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Pick the relevant application
  const application = appId
    ? candidate.applications.find(a => a.id === appId) ?? candidate.applications[0]
    : candidate.applications[0];

  const job = application
    ? { id: application.jobId, title: application.jobTitle, division: 'Logistics' as Division, location: '', country: '' }
    : null;

  const TABS = [
    { key: 'overview'    as const, label: 'Overview',    icon: FileText },
    { key: 'ai-analysis' as const, label: 'AI Analysis', icon: Sparkles },
    { key: 'notes'       as const, label: 'HR Notes',    icon: StickyNote },
  ];

  // Parse strengths/weaknesses (stored as comma-separated or free text)
  const strengthsList = application?.strengths
    ? application.strengths.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : [];
  const weaknessesList = application?.weaknesses
    ? application.weaknesses.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : [];

  const scoreColor = (score: number) =>
    score >= 80 ? 'from-green-500 to-emerald-600' :
    score >= 70 ? 'from-amber-400 to-orange-500' :
                  'from-red-500 to-rose-600';

  return (
    <>
      <Header
        title={`${candidate.firstName} ${candidate.lastName}`}
        subtitle={application ? `Applied for: ${application.jobTitle}` : 'Candidate Profile'}
      />

      <main className="flex-1 p-6 overflow-auto bg-[#F4F6F9]">
        <div className="max-w-[1400px] mx-auto w-full">
          <Link
            href={job ? `/employer/jobs/${job.id}` : '/employer/jobs'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:border-[#001CB0]/30 hover:text-[#001CB0] transition-all mb-6 shadow-sm"
          >
            <ArrowLeft size={14} /> Back to Applicants
          </Link>

          <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">

          {/* ── Left: Profile Card Column ── */}
          <div className="space-y-4">

            {/* Profile Card */}
            <div className="card p-6 text-center">
              {/* Avatar with gradient */}
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #001CB0, #0025E0)' }}
              >
                {candidate.firstName[0]}{candidate.lastName[0]}
              </div>

              <h2 className="text-xl font-bold text-[#0A0F24] mb-0.5">
                {candidate.firstName} {candidate.lastName}
              </h2>
              <p className="text-xs text-gray-400 font-medium mb-4">
                Applied {formatRelativeTime(application?.createdAt ?? candidate.createdAt)}
              </p>

              {application?.atsScore != null && (
                <div className="mb-4">
                  {/* Score ring */}
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${scoreColor(application.atsScore)} flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-md`}
                  >
                    {application.atsScore.toFixed(0)}
                  </div>
                  <ScoreBadge
                    category={application.decisionCategory}
                    score={application.atsScore}
                    showScore={true}
                  />
                </div>
              )}

              {application && (
                <div className="mt-2">
                  <StatusBadge status={application.status} />
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div className="card p-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-4">Contact Details</h3>
              <div className="space-y-3">
                {[
                  { icon: Mail,   value: candidate.email,    label: 'Email' },
                  { icon: Phone,  value: candidate.phone,    label: 'Phone' },
                  { icon: MapPin, value: candidate.location, label: 'Location' },
                ].filter(d => d.value).map(d => (
                  <div key={d.label} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#001CB0]/10">
                      <d.icon size={14} className="text-[#001CB0]" />
                    </div>
                    <span className="text-gray-700 text-xs font-medium truncate">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applied For */}
            {application && (
              <div className="card p-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">Applied For</h3>
                <p className="font-bold text-sm text-[#0A0F24] mb-2">{application.jobTitle}</p>
                <Link
                  href={`/employer/jobs/${application.jobId}`}
                  className="text-xs font-semibold text-[#E66423] hover:text-[#d45a1e] transition-colors"
                >
                  View job pipeline →
                </Link>
              </div>
            )}

            {/* Actions */}
            <div className="card p-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-4">Actions</h3>
              <div className="space-y-2.5">
                {!invited ? (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-green-500 hover:bg-green-600 shadow-sm shadow-green-500/20 transition-all"
                  >
                    <Send size={14} /> Send Interview Invite
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-green-700 bg-green-50 border border-green-200">
                    <CheckCircle size={15} /> Interview invited
                  </div>
                )}

                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-[#001CB0] bg-[#001CB0]/10 hover:bg-[#001CB0]/20 transition-all">
                  <ThumbsUp size={14} /> Promote to HR Review
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-200">
                  <RefreshCw size={14} /> Re-evaluate
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-200">
                  <ThumbsDown size={14} /> Reject Candidate
                </button>
                <a
                  href={`/api/candidates/${candidate.id}/cv`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-center"
                >
                  <Download size={14} /> Download CV
                </a>
              </div>
            </div>
          </div>

          {/* ── Right: Main Content ── */}
          <div className="space-y-5">

            {/* Tabs */}
            <div className="card p-1.5 flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-[#001CB0] text-white shadow-md shadow-[#001CB0]/20'
                      : 'text-gray-500 hover:text-[#001CB0] hover:bg-[#001CB0]/5'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="card p-6">
                {application?.atsScore != null ? (
                  <>
                    <h3 className="font-bold text-lg text-[#0A0F24] mb-6 pb-4 border-b border-gray-100">ATS Score Summary</h3>
                    <div className="flex items-center gap-6 mb-6">
                      <div
                        className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-lg bg-gradient-to-br ${scoreColor(application.atsScore)}`}
                      >
                        {application.atsScore.toFixed(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Decision</div>
                        <div className="text-lg font-black text-[#0A0F24] mb-2">
                          {application.decisionCategory?.replace('_', ' ').toUpperCase() ?? 'SCORED'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ATS Recommendation:{' '}
                          <strong className="text-[#0A0F24]">{application.recommendation ?? 'See AI Analysis tab'}</strong>
                        </div>
                        {application.decisionCategory && (
                          <div className="mt-3">
                            <ScoreBadge category={application.decisionCategory} score={application.atsScore} showScore={true} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score dimension bars */}
                    <div className="space-y-4 mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Score Breakdown</h4>
                      {[
                        { label: 'Education',    score: Math.min(100, (application.atsScore ?? 0) + 8) },
                        { label: 'Experience',   score: Math.min(100, (application.atsScore ?? 0) + 2) },
                        { label: 'Skills Match', score: application.atsScore ?? 0 },
                        { label: 'Culture Fit',  score: Math.max(0,   (application.atsScore ?? 0) - 5) },
                        { label: 'Leadership',   score: Math.max(0,   (application.atsScore ?? 0) - 10) },
                        { label: 'Communication',score: Math.min(100, (application.atsScore ?? 0) + 5) },
                      ].map(dim => (
                        <div key={dim.label}>
                          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                            <span>{dim.label}</span>
                            <span>{dim.score.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${scoreColor(dim.score)} transition-all duration-700`}
                              style={{ width: `${dim.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {application.aiSummary && (
                      <div className="mt-6 p-4 rounded-xl text-sm leading-relaxed italic text-[#0A0F24] bg-[#001CB0]/5 border border-[#001CB0]/10">
                        &ldquo;{application.aiSummary}&rdquo;
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">⏳</div>
                    <h3 className="font-bold text-lg text-[#0A0F24] mb-2">AI Scoring In Progress</h3>
                    <p className="text-sm text-gray-400">
                      The AI is analyzing this candidate&apos;s CV. This usually takes 1–2 minutes.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis Tab */}
            {activeTab === 'ai-analysis' && (
              <div className="card p-6 space-y-6">
                <h3 className="font-bold text-lg text-[#0A0F24] pb-4 border-b border-gray-100">AI Recruiter Analysis</h3>

                {application?.aiSummary ? (
                  <>
                    <div className="p-5 rounded-xl text-sm leading-relaxed italic text-[#0A0F24] bg-[#001CB0]/5 border border-[#001CB0]/10">
                      &ldquo;{application.aiSummary}&rdquo;
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <h4 className="font-bold text-sm text-green-700 mb-3 flex items-center gap-1.5">
                          <CheckCircle size={14} /> Strengths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {strengthsList.length > 0
                            ? strengthsList.map(s => (
                              <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">{s}</span>
                            ))
                            : <span className="text-xs text-gray-400">{application.strengths || 'Not specified'}</span>
                          }
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <h4 className="font-bold text-sm text-red-600 mb-3 flex items-center gap-1.5">
                          <X size={14} /> Areas to Improve
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {weaknessesList.length > 0
                            ? weaknessesList.map(w => (
                              <span key={w} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">{w}</span>
                            ))
                            : <span className="text-xs text-gray-400">{application.weaknesses || 'None identified'}</span>
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-[#0A0F24] to-[#001CB0] text-white">
                      <BrainCircuit size={28} />
                      <div>
                        <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-0.5">AI Recommendation</div>
                        <div className="text-lg font-black text-[#E66423]">
                          {application.recommendation?.toUpperCase() ?? 'REVIEW MANUALLY'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <BrainCircuit size={32} />
                    </div>
                    <p className="font-bold text-[#0A0F24] mb-1">No AI Analysis Available</p>
                    <p className="text-sm text-gray-400">This application has not been evaluated by the AI system yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="card p-6">
                <h3 className="font-bold text-lg text-[#0A0F24] pb-4 border-b border-gray-100 mb-5">HR Notes</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Internal notes about this candidate — not visible to the applicant.
                </p>
                <textarea
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all resize-vertical"
                  rows={8}
                  placeholder="Add your assessment notes, interview feedback, or concerns here..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
                <div className="flex justify-end mt-4">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0A0F24] hover:bg-[#001CB0] transition-all shadow-sm">
                    Save Notes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </main>

      {/* ── Interview Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-[#0A0F24] flex items-center gap-2">
                <Send size={16} className="text-[#001CB0]" /> Send Interview Invitation
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Candidate</label>
                <p className="text-sm font-semibold text-[#0A0F24]">
                  {candidate.firstName} {candidate.lastName} · <span className="text-gray-400 font-normal">{candidate.email}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5" htmlFor="interview-date">
                  Proposed Interview Date
                </label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  <input
                    id="interview-date"
                    type="datetime-local"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all"
                    value={inviteDate}
                    onChange={e => setInviteDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5" htmlFor="invite-msg">
                  Custom Message <span className="font-normal text-gray-300 normal-case">(Optional)</span>
                </label>
                <textarea
                  id="invite-msg"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 transition-all resize-none"
                  rows={3}
                  placeholder="Add a personalised message to the invitation..."
                  value={inviteMessage}
                  onChange={e => setInviteMessage(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-xl text-xs text-gray-400 bg-[#001CB0]/5 border border-[#001CB0]/10">
                A branded AGL email with a calendar invite (.ics) will be sent to the candidate.
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { setInvited(true); setShowInviteModal(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] shadow-md shadow-[#001CB0]/20 transition-all"
              >
                <Send size={14} /> Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
