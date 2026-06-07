'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import { ScoreBadge, StatusBadge } from '../../components/common/StatusBadge';
import { formatRelativeTime } from '../../lib/utils';
import { Search, Loader2, Users, ArrowRight, Eye, ChevronDown, AlertCircle } from 'lucide-react';
import type { ApplicationStatus, DecisionCategory } from '../../types';

interface CandidateApp {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  status: ApplicationStatus;
  atsScore?: number;
  decisionCategory?: DecisionCategory;
  createdAt: string;
}

const TABS = [
  { value: 'all', label: 'All Candidates' },
  { value: 'fast_track', label: 'Fast Track' },
  { value: 'hr_review', label: 'HR Review' },
  { value: 'interview_invited', label: 'Shortlisted' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export default function CandidatesPage() {
  const [applications, setApplications] = useState<CandidateApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    setLoading(true);
    fetch('/api/applications?limit=100')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setApplications(data.data ?? []);
        } else {
          setError(data.error ?? 'Failed to load candidates');
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  // Filter logic
  const filtered = applications.filter((app) => {
    // 1. Tab filter
    if (activeTab === 'fast_track') {
      if (app.decisionCategory !== 'fast_track' && app.decisionCategory !== 'auto_invite') {
        return false;
      }
    } else if (activeTab === 'hr_review') {
      if (app.status !== 'hr_review') return false;
    } else if (activeTab === 'interview_invited') {
      if (app.status !== 'interview_invited') return false;
    } else if (activeTab === 'hired') {
      if (app.status !== 'hired') return false;
    } else if (activeTab === 'rejected') {
      if (app.status !== 'rejected') return false;
    }

    // 2. Search filter
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${app.candidate.firstName} ${app.candidate.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        app.candidate.email.toLowerCase().includes(q) ||
        app.jobTitle.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.atsScore ?? 0) - (a.atsScore ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Counts for tabs
  const getTabCount = (tab: TabValue) => {
    if (tab === 'all') return applications.length;
    return applications.filter((app) => {
      if (tab === 'fast_track') {
        return app.decisionCategory === 'fast_track' || app.decisionCategory === 'auto_invite';
      }
      if (tab === 'hr_review') return app.status === 'hr_review';
      if (tab === 'interview_invited') return app.status === 'interview_invited';
      if (tab === 'hired') return app.status === 'hired';
      if (tab === 'rejected') return app.status === 'rejected';
      return false;
    }).length;
  };

  return (
    <>
      <Header
        title="Candidate Management"
        subtitle="Review, track and filter applicants across all active roles"
      />

      <main className="flex-1 p-6 sm:p-8 overflow-auto bg-[#F4F6F9]">
        <div className="max-w-[1400px] mx-auto w-full space-y-6">
          
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Filter Tabs */}
            <div className="flex rounded-xl overflow-hidden border border-[#E2E6EF] bg-white shadow-sm flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === tab.value
                      ? 'bg-gradient-to-r from-[#001CB0] to-[#0025E0] text-white'
                      : 'text-[#535E75] hover:bg-[#F4F6F9] hover:text-[#0A0F24]'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      activeTab === tab.value
                        ? 'bg-white/25 text-white'
                        : 'bg-[#F4F6F9] text-[#535E75]'
                    }`}
                  >
                    {getTabCount(tab.value)}
                  </span>
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                className="appearance-none bg-white border border-[#E2E6EF] rounded-xl px-4 py-2.5 pr-9 text-sm text-[#0A0F24] font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001CB0]/20 focus:border-[#001CB0] transition-all duration-200 cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
              >
                <option value="date">Sort: Recent Applied</option>
                <option value="score">Sort: ATS Score</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#535E75] pointer-events-none" />
            </div>

            {/* Keyword Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#535E75]" />
              <input
                className="w-full bg-white border border-[#E2E6EF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0A0F24] placeholder:text-[#535E75] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#001CB0]/20 focus:border-[#001CB0] transition-all duration-200"
                placeholder="Search candidates, jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-8 animate-pulse space-y-4">
              <div className="h-6 bg-[#E2E6EF] rounded w-1/4" />
              <div className="space-y-3 pt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-[#E2E6EF] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#E2E6EF] rounded w-1/3" />
                      <div className="h-3 bg-[#E2E6EF] rounded w-1/4" />
                    </div>
                    <div className="w-20 h-6 bg-[#E2E6EF] rounded-full" />
                    <div className="w-24 h-8 bg-[#E2E6EF] rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-4"><AlertCircle size={28} /></div>
              <h3 className="text-lg font-bold text-[#0A0F24] mb-1">Failed to load candidates</h3>
              <p className="text-sm text-[#535E75] mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#001CB0] text-white text-sm font-semibold rounded-xl hover:bg-[#0025D4] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Candidates List Table */}
          {!loading && !error && sorted.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm overflow-hidden animate-fade-in-up">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-[#E2E6EF] bg-[#F8FAFC]">
                      <th className="px-6 py-4 text-xs font-bold text-[#535E75] uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#535E75] uppercase tracking-wider">Applied Position</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#535E75] uppercase tracking-wider">ATS Score</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#535E75] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#535E75] uppercase tracking-wider">Applied</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E6EF]">
                    {sorted.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-[#F8FAFC] transition-colors group"
                      >
                        {/* Avatar + Personal Details */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-gradient-to-br from-[#001CB0] to-[#0025E0] ring-2 ring-[#001CB0]/10"
                            >
                              {app.candidate.firstName[0]}
                              {app.candidate.lastName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-[#0A0F24]">
                                {app.candidate.firstName} {app.candidate.lastName}
                              </div>
                              <div className="text-xs text-[#535E75]">
                                {app.candidate.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Applied Position */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#0A0F24]">{app.jobTitle}</div>
                          <div className="text-xs text-[#535E75] mt-0.5">Guest Application</div>
                        </td>

                        {/* ATS Score */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {app.atsScore != null ? (
                            <ScoreBadge category={app.decisionCategory} score={app.atsScore} showScore={true} />
                          ) : (
                            <span className="text-xs text-[#8A93AA] font-medium">Scoring in progress...</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={app.status} />
                        </td>

                        {/* Relative Applied Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-[#535E75]">
                          {formatRelativeTime(app.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/employer/candidates/${app.candidateId}?appId=${app.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#001CB0]/10 text-[#001CB0] text-xs font-bold hover:bg-[#001CB0] hover:text-white transition-all duration-200"
                          >
                            <Eye size={13} />
                            Profile
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && sorted.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F4F6F9] border border-[#E2E6EF] flex items-center justify-center mx-auto mb-4 text-[#535E75]">
                <Users size={28} />
              </div>
              <h3 className="text-lg font-bold text-[#0A0F24] mb-1">No candidates found</h3>
              <p className="text-sm text-[#535E75] max-w-xs mx-auto">
                {applications.length === 0
                  ? 'There are no job applications submitted yet.'
                  : 'Try adjusting your search query or tab filters.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
