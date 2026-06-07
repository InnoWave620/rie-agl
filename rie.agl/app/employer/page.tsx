'use client';

import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Link from 'next/link';
import {
  formatRelativeTime,
  getScoreBadgeClass,
  getStatusClass,
  getStatusLabel,
} from '../lib/utils';
import {
  Users,
  Briefcase,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  MapPin,
  ChevronRight,
  BarChart3,
  Plus,
} from 'lucide-react';
import type { Job, AnalyticsSummary, AuthSession } from '../types';

/* ─── local types ──────────────────────────────────────────────── */
interface RecentApp {
  id: string;
  jobId: string;
  jobTitle?: string;
  candidateId: string;
  candidate: { firstName: string; lastName: string; email: string };
  atsScore?: number;
  decisionCategory?: string;
  status: string;
  createdAt: string;
}

/* ─── tiny helpers ─────────────────────────────────────────────── */
function getHour() {
  return new Date().getHours();
}
function greeting() {
  const h = getHour();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Avatar initials circle with deterministic colour */
function Avatar({
  firstName,
  lastName,
  size = 'md',
}: {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md';
}) {
  const palette = [
    ['#EEF2FF', '#4F46E5'],
    ['#FEF3E7', '#E66423'],
    ['#DCFCE7', '#16A34A'],
    ['#FEE2E2', '#DC2626'],
    ['#E0F2FE', '#0284C7'],
    ['#F3E8FF', '#9333EA'],
  ];
  const idx = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % palette.length;
  const [bg, color] = palette[idx];
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ background: bg, color }}
    >
      {firstName[0]}
      {lastName[0]}
    </div>
  );
}

/* ─── Skeleton primitives ──────────────────────────────────────── */
function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function SkeletonStatCard() {
  return (
    <div className="stat-card relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-200 animate-pulse" />
      <div className="flex items-start justify-between mb-4 mt-1">
        <Pulse className="w-11 h-11 rounded-xl" />
        <Pulse className="w-16 h-5 rounded-full" />
      </div>
      <Pulse className="w-20 h-9 mb-2" />
      <Pulse className="w-28 h-4 mb-1" />
      <Pulse className="w-20 h-3" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Pulse className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Pulse className="w-28 h-3.5" />
            <Pulse className="w-36 h-3" />
          </div>
        </div>
      </td>
      {[1, 2, 3, 4].map((x) => (
        <td key={x} className="px-5 py-3.5">
          <Pulse className="w-20 h-4 rounded" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonJobCard() {
  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-[#E2E6EF] shadow-sm p-4 space-y-3">
      <Pulse className="w-3/4 h-5" />
      <Pulse className="w-1/2 h-4" />
      <div className="flex gap-2">
        <Pulse className="w-16 h-6 rounded-full" />
        <Pulse className="w-20 h-6 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Pulse className="w-16 h-4" />
        <Pulse className="w-10 h-4" />
      </div>
    </div>
  );
}

/* ─── KPI Stat Card ────────────────────────────────────────────── */
interface StatConfig {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  barColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  delay: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  barColor,
  trend,
  trendLabel,
  delay,
}: StatConfig) {
  return (
    <div
      className="stat-card relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      {/* coloured top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: barColor }}
      />

      <div className="flex items-start justify-between mt-1 mb-4">
        {/* icon circle */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>

        {/* trend chip */}
        {trend && trend !== 'neutral' && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend === 'up'
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {trendLabel}
          </span>
        )}
      </div>

      <div className="text-[2rem] font-black leading-none mb-1.5 text-[#0A0F24]">
        {value}
      </div>
      <div className="text-sm font-semibold mb-0.5 text-[#0A0F24]">{label}</div>
      <div className="text-xs text-[#535E75]">{sub}</div>
    </div>
  );
}

/* ─── Pipeline bar ─────────────────────────────────────────────── */
function PipelineBar({
  stage,
  count,
  pct,
  color,
}: {
  stage: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-[#0A0F24]">{stage}</span>
        <div className="flex items-center gap-2">
          <span className="text-[#535E75] text-xs">{pct.toFixed(0)}%</span>
          <span className="font-bold text-[#0A0F24] min-w-[1.5rem] text-right">
            {count}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-[#F4F6F9] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ─── Active Job Card (horizontal scroll) ──────────────────────── */
function JobCard({ job, delay }: { job: Job; delay: number }) {
  const isPublished = job.status === 'published';
  return (
    <Link
      href={`/employer/jobs/${job.id}`}
      className="flex-shrink-0 w-64 bg-white rounded-xl border border-[#E2E6EF] shadow-sm p-4
                 hover:shadow-md hover:border-[#001CB0]/30 hover:-translate-y-0.5
                 transition-all duration-200 animate-fade-in-up group"
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      {/* title */}
      <p className="font-bold text-sm text-[#0A0F24] leading-snug line-clamp-2 mb-1 group-hover:text-[#001CB0] transition-colors">
        {job.title}
      </p>

      {/* dept badge */}
      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#001CB0] mb-3">
        {job.division}
      </span>

      {/* location */}
      {job.location && (
        <div className="flex items-center gap-1 text-[#535E75] text-xs mb-3">
          <MapPin size={11} />
          <span className="truncate">{job.location}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#F4F6F9]">
        {/* applicant count */}
        <div className="flex items-center gap-1.5 text-xs text-[#535E75]">
          <Users size={12} />
          <span className="font-semibold text-[#0A0F24]">
            {job.applicantCount ?? 0}
          </span>{' '}
          applicants
        </div>

        {/* status dot */}
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPublished
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isPublished && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          )}
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Page                                                       */
/* ═══════════════════════════════════════════════════════════════ */
export default function EmployerDashboard() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth').then((r) => r.json()),
      fetch('/api/analytics').then((r) => r.json()),
      fetch('/api/jobs').then((r) => r.json()),
      fetch('/api/applications?limit=5').then((r) => r.json()),
    ])
      .then(([auth, a, j, apps]) => {
        if (auth.success) setSession(auth.data.user);
        if (a.success) setAnalytics(a.data);
        if (j.success) setJobs(j.data);
        if (apps.success) setRecentApps(apps.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const published = jobs.filter((j) => j.status === 'published');

  const stats: StatConfig[] = analytics
    ? [
        {
          label: 'Open Positions',
          value: analytics.openPositions,
          sub: `${published.length} published`,
          icon: Briefcase,
          iconBg: '#EEF2FF',
          iconColor: '#001CB0',
          barColor: '#001CB0',
          trend: 'up',
          trendLabel: '+2 this week',
          delay: 0,
        },
        {
          label: 'Total Applications',
          value: analytics.totalApplications,
          sub: `${analytics.cvScreenedToday} screened today`,
          icon: Users,
          iconBg: '#FEF3E7',
          iconColor: '#E66423',
          barColor: '#E66423',
          trend: 'up',
          trendLabel: '+12%',
          delay: 0.07,
        },
        {
          label: 'Avg. ATS Score',
          value: `${analytics.avgAtsScore}`,
          sub: 'Across all candidates',
          icon: Award,
          iconBg: '#DCFCE7',
          iconColor: '#16A34A',
          barColor: '#16A34A',
          trend: 'neutral',
          delay: 0.14,
        },
        {
          label: 'Avg. Screening Time',
          value: analytics.avgTimeToHire,
          sub: 'Target: instant grading',
          icon: Clock,
          iconBg: '#DCFCE7',
          iconColor: '#16A34A',
          barColor: '#16A34A',
          trend: 'up',
          trendLabel: 'On target',
          delay: 0.21,
        },
      ]
    : [];

  /* ── JSX ─────────────────────────────────────────────────────── */
  return (
    <>
      <Header
        title={`${greeting()}, ${session?.firstName ?? '…'}`}
        subtitle="Here's your recruitment overview for today"
        user={
          session
            ? {
                firstName: session.firstName,
                avatarInitials: session.avatarInitials,
              }
            : undefined
        }
      />

      <main className="flex-1 p-6 sm:p-8 overflow-auto bg-[#F4F6F9]">
        <div className="max-w-[1400px] mx-auto space-y-8 w-full">
          {/* ── KPI Stat Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {loading
              ? [0, 1, 2, 3].map((i) => <SkeletonStatCard key={i} />)
              : stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* ── Middle row: Applications table + Pipeline ────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Recent Applications */}
            <div
              className="card xl:col-span-2 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.28s', opacity: 0 }}
            >
              {/* header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#F4F6F9]">
                <div>
                  <h2 className="font-bold text-[#0A0F24]">Recent Applications</h2>
                  <p className="text-xs mt-0.5 text-[#535E75]">
                    Latest candidate activity
                  </p>
                </div>
                <Link
                  href="/employer/jobs"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E66423]
                             hover:text-[#c8501a] transition-colors"
                >
                  View all <ArrowRight size={12} />
                </Link>
              </div>

              {/* table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#F4F6F9]">
                      {['Candidate', 'Position', 'ATS Score', 'Status', 'Applied'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-xs font-semibold text-[#535E75] uppercase tracking-wide whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F6F9]">
                    {loading ? (
                      [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
                    ) : recentApps.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-sm text-[#535E75]"
                        >
                          No applications yet.
                        </td>
                      </tr>
                    ) : (
                      recentApps.map((app, i) => (
                        <tr
                          key={app.id}
                          className="hover:bg-[#F4F6F9]/60 transition-colors animate-fade-in-up"
                          style={{ animationDelay: `${0.3 + i * 0.05}s`, opacity: 0 }}
                        >
                          {/* candidate */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar
                                firstName={app.candidate.firstName}
                                lastName={app.candidate.lastName}
                              />
                              <div>
                                <div className="font-semibold text-[#0A0F24]">
                                  {app.candidate.firstName} {app.candidate.lastName}
                                </div>
                                <div className="text-xs text-[#535E75]">
                                  {app.candidate.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* position */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-medium text-[#0A0F24]">
                              {app.jobTitle ??
                                jobs.find((j) => j.id === app.jobId)?.title ??
                                '—'}
                            </span>
                          </td>

                          {/* ATS score */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {app.atsScore != null ? (
                              <span
                                className={getScoreBadgeClass(
                                  app.decisionCategory as never
                                )}
                              >
                                {Number(app.atsScore).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-xs text-[#535E75]">Pending</span>
                            )}
                          </td>

                          {/* status */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={getStatusClass(app.status as never)}>
                              {getStatusLabel(app.status as never)}
                            </span>
                          </td>

                          {/* time */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-xs text-[#535E75]">
                            {formatRelativeTime(app.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pipeline Snapshot */}
            <div
              className="card overflow-hidden flex flex-col animate-fade-in-up"
              style={{ animationDelay: '0.35s', opacity: 0 }}
            >
              <div className="px-5 py-4 border-b border-[#F4F6F9]">
                <h2 className="font-bold text-[#0A0F24]">Pipeline Snapshot</h2>
                <p className="text-xs mt-0.5 text-[#535E75]">Current funnel health</p>
              </div>

              <div className="p-5 space-y-5 flex-1">
                {loading
                  ? [0, 1, 2, 3].map((i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between">
                          <Pulse className="w-24 h-4" />
                          <Pulse className="w-10 h-4" />
                        </div>
                        <Pulse className="w-full h-2 rounded-full" />
                      </div>
                    ))
                  : (analytics?.pipelineFunnel ?? []).map((stage) => (
                      <PipelineBar
                        key={stage.stage}
                        stage={stage.stage}
                        count={stage.count}
                        pct={stage.pct}
                        color={stage.color}
                      />
                    ))}
              </div>

              <div className="px-5 pb-5">
                <Link
                  href="/employer/analytics"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
                             border-2 border-[#001CB0] text-[#001CB0] text-sm font-semibold
                             hover:bg-[#001CB0] hover:text-white transition-all duration-200"
                >
                  <BarChart3 size={15} />
                  Full Analytics
                </Link>
              </div>
            </div>
          </div>

          {/* ── Active Jobs – horizontal scroll ─────────────────────── */}
          <div
            className="card overflow-hidden animate-fade-in-up"
            style={{ animationDelay: '0.42s', opacity: 0 }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F4F6F9]">
              <div>
                <h2 className="font-bold text-[#0A0F24]">Active Job Postings</h2>
                <p className="text-xs mt-0.5 text-[#535E75]">
                  {loading ? '…' : `${published.length} published positions`}
                </p>
              </div>
              <Link
                href="/employer/jobs/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg
                           bg-[#001CB0] text-white text-xs font-semibold
                           hover:bg-[#0025d4] transition-colors shadow-sm"
              >
                <Plus size={13} />
                Post Job
              </Link>
            </div>

            {/* scrollable cards */}
            <div className="px-5 py-5 overflow-x-auto">
              {loading ? (
                <div className="flex gap-5 pb-1">
                  {[0, 1, 2, 3].map((i) => (
                    <SkeletonJobCard key={i} />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <p className="text-sm text-center py-8 text-[#535E75]">
                  No jobs yet.{' '}
                  <Link
                    href="/employer/jobs/new"
                    className="text-[#001CB0] font-semibold hover:underline"
                  >
                    Post your first role →
                  </Link>
                </p>
              ) : (
                <div className="flex gap-5 pb-1">
                  {jobs.map((job, i) => (
                    <JobCard key={job.id} job={job} delay={0.44 + i * 0.05} />
                  ))}

                  {/* "See all" faux card */}
                  <Link
                    href="/employer/jobs"
                    className="flex-shrink-0 w-40 bg-[#F4F6F9] rounded-xl border-2 border-dashed
                               border-[#E2E6EF] flex flex-col items-center justify-center gap-2
                               text-[#535E75] hover:border-[#001CB0] hover:text-[#001CB0]
                               transition-colors p-4"
                  >
                    <ChevronRight size={20} />
                    <span className="text-xs font-semibold text-center">
                      See all jobs
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
