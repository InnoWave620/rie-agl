import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import { ScoreBadge, StatusBadge, DivisionBadge } from '../../../components/common/StatusBadge';
import { query } from '../../../lib/db';
import { formatDate, formatRelativeTime, pluralize } from '../../../lib/utils';
import { ArrowLeft, MapPin, Clock, Users, Eye, ExternalLink, Edit2, Inbox } from 'lucide-react';
import type { Division, ApplicationStatus, DecisionCategory } from '../../../types';
import TopCandidatesQueue from './TopCandidatesQueue';

interface Props { params: Promise<{ id: string }> }

interface DBJob {
  JobID: number; Title: string; Department: string; Location: string;
  EmploymentType: string; Description: string; Requirements: string | null;
  Status: string; CreatedDate: Date | string;
}

interface DBApp {
  ApplicationID: number; ApplicantID: number; JobID: number;
  ApplicationStatus: string; CreatedDate: Date | string;
  FullName: string; Email: string; Phone: string | null; ApplicantLocation: string | null;
  FinalScore: number | string | null; Recommendation: string | null;
}

function toAppStatus(raw: string, hasScore: boolean): ApplicationStatus {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('interview')) return 'interview_invited';
  if (s.includes('hired'))     return 'hired';
  if (s.includes('reject'))    return 'rejected';
  if (s.includes('review'))    return 'hr_review';
  if (hasScore)                return 'scored';
  if (s.includes('scoring'))   return 'scoring';
  return 'pending';
}

function toDecision(score: number): DecisionCategory {
  if (score >= 90) return 'fast_track';
  if (score >= 80) return 'auto_invite';
  if (score >= 70) return 'hr_review';
  if (score >= 60) return 'feedback';
  return 'auto_reject';
}

function toJobStatus(raw: string) {
  const s = (raw ?? '').toLowerCase();
  if (s === 'open')   return 'published';
  if (s === 'closed') return 'closed';
  return 'draft';
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const jobId = parseInt(id);
  if (isNaN(jobId)) notFound();

  const [jobRows, appRows] = await Promise.all([
    query<DBJob>(`
      SELECT JobID, Title, Department, Location, EmploymentType,
             Description, Requirements, Status, CreatedDate
      FROM Jobs WHERE JobID = ${jobId}
    `).catch(() => [] as DBJob[]),

    query<DBApp>(`
      SELECT
        a.ApplicationID, a.ApplicantID, a.JobID, a.ApplicationStatus, a.CreatedDate,
        ap.FullName, ap.Email, ap.Phone, ap.Location AS ApplicantLocation,
        ats.FinalScore, ats.Recommendation
      FROM Applications a
      JOIN  Applicants ap  ON ap.ApplicantID  = a.ApplicantID
      LEFT JOIN ATS_Scores ats ON ats.ApplicationID = a.ApplicationID
      WHERE a.JobID = ${jobId}
      ORDER BY ISNULL(CAST(ats.FinalScore AS FLOAT), 0) DESC
    `).catch(() => [] as DBApp[]),
  ]);

  if (!jobRows.length) notFound();

  const row = jobRows[0];
  const job = {
    id:              String(row.JobID),
    title:           row.Title ?? '',
    slug:            (row.Title ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    division:        row.Department as Division,
    location:        row.Location ?? '',
    country:         '',
    experienceLevel: 'Mid',
    status:          toJobStatus(row.Status),
    applicantCount:  appRows.length,
    closingDate:     undefined as string | undefined,
  };

  const applications = appRows.map(r => {
    const nameParts = (r.FullName ?? '').split(' ');
    const score     = r.FinalScore != null ? parseFloat(String(r.FinalScore)) : undefined;
    const hasScore  = score != null && !isNaN(score);
    return {
      id:               String(r.ApplicationID),
      candidateId:      String(r.ApplicantID),
      candidate: {
        firstName: nameParts[0] ?? '',
        lastName:  nameParts.slice(1).join(' ') ?? '',
        email:     r.Email ?? '',
        location:  r.ApplicantLocation ?? '',
      },
      atsScore:         hasScore ? score : undefined,
      decisionCategory: hasScore ? toDecision(score!) : undefined,
      status:           toAppStatus(r.ApplicationStatus, hasScore) as ApplicationStatus,
      createdAt:        r.CreatedDate ? new Date(r.CreatedDate).toISOString() : '',
    };
  });

  // Mini stats
  const fastTrackCount = applications.filter(
    a => a.decisionCategory === 'fast_track' || a.decisionCategory === 'auto_invite'
  ).length;
  const hrReviewCount = applications.filter(a => a.decisionCategory === 'hr_review').length;
  const scored = applications.filter(a => a.atsScore != null);
  const avgScore = scored.length > 0
    ? (scored.reduce((s, a) => s + (a.atsScore ?? 0), 0) / scored.length).toFixed(1)
    : '—';

  const stats = [
    { label: 'Total Applicants',    value: applications.length, colorClass: 'text-[#0A0F24]',  bgClass: 'bg-[#F4F6F9]' },
    { label: 'Fast Track / Invite', value: fastTrackCount,      colorClass: 'text-green-600',  bgClass: 'bg-green-50' },
    { label: 'HR Review',           value: hrReviewCount,        colorClass: 'text-amber-600',  bgClass: 'bg-amber-50' },
    { label: 'Avg. Score',          value: avgScore,             colorClass: 'text-[#E66423]',  bgClass: 'bg-orange-50' },
  ];

  const statusBadgeClass = job.status === 'published'
    ? 'bg-green-100 text-green-700'
    : job.status === 'closed'
    ? 'bg-[#F4F6F9] text-[#535E75]'
    : 'bg-amber-100 text-amber-700';

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-[#E2E6EF] px-6 py-4">
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/employer/jobs"
              className="inline-flex items-center gap-1.5 text-sm text-[#535E75] hover:text-[#1b365f] font-medium transition-colors duration-200"
            >
              <ArrowLeft size={15} />
              All Jobs
            </Link>
            <div className="h-5 w-px bg-[#E2E6EF]" />
            <div>
              <h1 className="text-xl font-bold text-[#0A0F24] truncate max-w-xs sm:max-w-lg">{job.title}</h1>
              <p className="text-sm text-[#535E75] mt-0.5">
                {job.location}{job.country ? `, ${job.country}` : ''} · {job.division} Division
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/careers/${job.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E6EF] text-sm font-semibold text-[#0A0F24] bg-white hover:bg-[#F4F6F9] transition-all duration-200"
            >
              <ExternalLink size={14} />
              View Public
            </Link>
            <Link
              href={`/employer/jobs/${job.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1b365f] to-[#1b365f] text-white text-sm font-semibold shadow-sm hover:shadow-md hover:opacity-95 transition-all duration-200"
            >
              <Edit2 size={14} />
              Edit Job
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 overflow-auto bg-[#F4F6F9]">
        <div className="max-w-[1400px] mx-auto w-full space-y-6">

        {/* Job Overview Card */}
        <div className="card p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <DivisionBadge division={job.division} />
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#F4F6F9] text-[#535E75]">
                  {job.experienceLevel}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold inline-flex items-center gap-1 ${statusBadgeClass}`}>
                  {job.status === 'published' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />}
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#0A0F24] mb-2">{job.title}</h2>
              <div className="flex flex-wrap gap-5 text-sm text-[#535E75]">
                <span className="flex items-center gap-1.5"><MapPin size={13} />{job.location}</span>
                <span className="flex items-center gap-1.5"><Users size={13} />{pluralize(job.applicantCount, 'applicant')}</span>
                {job.closingDate && (
                  <span className="flex items-center gap-1.5"><Clock size={13} />Closes {formatDate(job.closingDate)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E2E6EF]">
            {stats.map(s => (
              <div key={s.label} className={`rounded-xl p-4 text-center ${s.bgClass}`}>
                <div className={`text-3xl font-bold mb-1 ${s.colorClass}`}>{s.value}</div>
                <div className="text-xs text-[#535E75] font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Candidates Queue */}
        <TopCandidatesQueue jobId={job.id} applications={applications} />

        {/* Applicant Pipeline Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E6EF]">
            <div>
              <h2 className="text-base font-bold text-[#0A0F24]">Applicant Pipeline</h2>
              <p className="text-xs text-[#535E75] mt-0.5">
                {applications.length} total · sorted by ATS score
              </p>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F4F6F9] border border-[#E2E6EF] flex items-center justify-center">
                <Inbox size={28} className="text-[#535E75]" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#0A0F24]">No applications yet</p>
                <p className="text-sm text-[#535E75] mt-1">Share the job posting to attract candidates.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6EF] bg-[#F4F6F9]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Candidate</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">ATS Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">AI Recommendation</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Applied</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6EF]">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-[#F4F6F9] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1b365f] to-[#1b365f] text-white text-xs font-bold shrink-0">
                            {app.candidate.firstName[0] ?? '?'}{app.candidate.lastName[0] ?? ''}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0A0F24]">
                              {app.candidate.firstName} {app.candidate.lastName}
                            </div>
                            <div className="text-xs text-[#535E75] mt-0.5">{app.candidate.location || app.candidate.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {app.atsScore != null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#0A0F24] text-sm">
                              {app.atsScore.toFixed(1)}
                            </span>
                            <div className="w-16 h-1.5 bg-[#E2E6EF] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${app.atsScore}%`,
                                  background: app.atsScore >= 80 ? '#22C55E' : app.atsScore >= 70 ? '#F59E0B' : '#EF4444'
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#535E75]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {app.decisionCategory ? (
                          <ScoreBadge category={app.decisionCategory} showScore={false} />
                        ) : (
                          <span className="text-xs text-[#535E75]">Processing…</span>
                        )}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={app.status} /></td>
                      <td className="px-4 py-4 text-xs text-[#535E75]">
                        {formatRelativeTime(app.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/employer/candidates/${app.candidateId}?appId=${app.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#1b365f] to-[#1b365f] text-white text-xs font-semibold hover:shadow-md hover:opacity-95 transition-all duration-200"
                        >
                          <Eye size={12} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </main>
    </>
  );
}
