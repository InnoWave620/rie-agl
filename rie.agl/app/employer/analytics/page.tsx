'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import { TimeToHireChart, PipelineFunnelChart, ScoreDistributionChart, ApplicationVolumeChart } from '../../components/analytics/Charts';
import { TrendingDown, Users, Target, ShieldCheck, Clock, FileSearch, Loader2, BarChart3 } from 'lucide-react';
import type { AnalyticsSummary } from '../../types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => {
        if (d.success) setAnalytics(d.data);
        else setError(d.error ?? 'Failed to load analytics');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        {/* Page Header */}
        <div className="bg-white border-b border-[#E2E6EF] px-6 py-4">
          <h1 className="text-xl font-bold text-[#0A0F24]">Analytics &amp; Reporting</h1>
          <p className="text-sm text-[#535E75] mt-0.5">Recruitment performance metrics across all divisions</p>
        </div>
        <main className="flex-1 p-6 overflow-auto bg-[#F4F6F9] space-y-6">
          {/* KPI Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-5 animate-pulse">
                <div className="w-10 h-10 bg-[#E2E6EF] rounded-xl mb-4" />
                <div className="h-7 bg-[#E2E6EF] rounded-lg w-3/4 mb-2" />
                <div className="h-3 bg-[#E2E6EF] rounded-lg w-full mb-1" />
                <div className="h-3 bg-[#E2E6EF] rounded-lg w-2/3" />
              </div>
            ))}
          </div>
          {/* Chart Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-5 animate-pulse">
                <div className="h-4 bg-[#E2E6EF] rounded-lg w-1/3 mb-2" />
                <div className="h-3 bg-[#E2E6EF] rounded-lg w-1/2 mb-5" />
                <div className="h-48 bg-[#E2E6EF] rounded-lg" />
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  if (error || !analytics) {
    return (
      <>
        <div className="bg-white border-b border-[#E2E6EF] px-6 py-4">
          <h1 className="text-xl font-bold text-[#0A0F24]">Analytics &amp; Reporting</h1>
          <p className="text-sm text-[#535E75] mt-0.5">Recruitment performance metrics</p>
        </div>
        <main className="flex-1 flex items-center justify-center bg-[#F4F6F9]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
            <p className="text-sm font-semibold text-red-600">{error ?? 'No data available'}</p>
          </div>
        </main>
      </>
    );
  }

  const a = analytics;

  const KPIs = [
    {
      label: 'Total Applications', value: a.totalApplications, sub: 'All time',
      icon: FileSearch, color: '#001CB0', bg: 'bg-blue-50',
    },
    {
      label: 'Avg. Time-to-Hire', value: `${a.avgTimeToHire}d`, sub: 'Target: 21 days',
      icon: Clock,
      color: a.avgTimeToHire <= 21 ? '#22C55E' : '#F59E0B',
      bg:   a.avgTimeToHire <= 21 ? 'bg-green-50' : 'bg-amber-50',
    },
    {
      label: 'CVs Screened / Day', value: a.cvScreenedToday, sub: 'AI-powered screening',
      icon: TrendingDown, color: '#E66423', bg: 'bg-orange-50',
    },
    {
      label: 'Offer Acceptance', value: `${a.offersAccepted}%`, sub: 'With AI-assisted matching',
      icon: Target, color: '#22C55E', bg: 'bg-green-50',
    },
    {
      label: 'Hires This Month', value: a.hiresThisMonth, sub: 'From database',
      icon: Users, color: '#001CB0', bg: 'bg-blue-50',
    },
    {
      label: 'POPIA Compliance', value: `${a.complianceScore}%`, sub: 'Full audit pass',
      icon: ShieldCheck, color: '#22C55E', bg: 'bg-green-50',
    },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-[#E2E6EF] px-6 py-4">
        <h1 className="text-xl font-bold text-[#0A0F24]">Analytics &amp; Reporting</h1>
        <p className="text-sm text-[#535E75] mt-0.5">Recruitment performance metrics across all divisions</p>
      </div>

      <main className="flex-1 p-6 overflow-auto bg-[#F4F6F9] space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {KPIs.map((kpi, i) => (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-5 animate-fade-in-up hover:shadow-md transition-all duration-200"
              style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${kpi.bg}`}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
              <div className="text-3xl font-bold text-[#0A0F24] mb-1 leading-none">{kpi.value}</div>
              <div className="text-xs font-semibold text-[#0A0F24] mb-1">{kpi.label}</div>
              <div className="text-xs text-[#535E75]">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-6 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#0A0F24]">Time-to-Hire Trend</h2>
              <p className="text-xs text-[#535E75] mt-0.5">Monthly average vs. 21-day target</p>
            </div>
            {a.timeToHireTrend.length > 0
              ? <TimeToHireChart data={a.timeToHireTrend} />
              : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#535E75]">
                  <BarChart3 size={32} className="opacity-40" />
                  <p className="text-sm text-center">No trend data yet — will appear as applications progress.</p>
                </div>
              )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-6 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.15s' }}>
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#0A0F24]">Application Volume</h2>
              <p className="text-xs text-[#535E75] mt-0.5">Weekly applications received vs. AI scored</p>
            </div>
            <ApplicationVolumeChart />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-6 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.2s' }}>
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#0A0F24]">Recruitment Funnel</h2>
              <p className="text-xs text-[#535E75] mt-0.5">Applied → Scored → HR Review → Interview → Hired</p>
            </div>
            {a.pipelineFunnel.length > 0
              ? <PipelineFunnelChart data={a.pipelineFunnel} />
              : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#535E75]">
                  <BarChart3 size={32} className="opacity-40" />
                  <p className="text-sm text-center">No pipeline data yet.</p>
                </div>
              )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-6 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.25s' }}>
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#0A0F24]">ATS Score Distribution</h2>
              <p className="text-xs text-[#535E75] mt-0.5">How candidates score across all dimensions</p>
            </div>
            {a.scoreDistribution.some(b => b.count > 0) ? (
              <>
                <ScoreDistributionChart data={a.scoreDistribution} />
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#E2E6EF]">
                  {a.scoreDistribution.map(b => (
                    <div key={b.range} className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: b.fill }} />
                      <span className="text-[#535E75]">{b.range}: {b.category} <span className="font-semibold text-[#0A0F24]">({b.count})</span></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#535E75]">
                <BarChart3 size={32} className="opacity-40" />
                <p className="text-sm text-center">No ATS scores recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recruiter Productivity Table */}
        {a.recruiterStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm overflow-hidden animate-fade-in-up" style={{ opacity: 0, animationDelay: '0.3s' }}>
            <div className="px-6 py-4 border-b border-[#E2E6EF]">
              <h2 className="text-base font-bold text-[#0A0F24]">Recruiter Productivity</h2>
              <p className="text-xs text-[#535E75] mt-0.5">Performance metrics per team member</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E6EF] bg-[#F4F6F9]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Recruiter</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">CVs Screened</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Interviews</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Hires</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Avg. Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#535E75] uppercase tracking-wider">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6EF]">
                  {a.recruiterStats.map((r, i) => (
                    <tr key={r.name} className="hover:bg-[#F4F6F9] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: i === 0 ? '#E66423' : '#001CB0' }}
                          >
                            {r.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-semibold text-[#0A0F24]">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-base font-bold text-[#0A0F24]">{r.screenings}</span>
                      </td>
                      <td className="px-4 py-4 text-[#0A0F24]">{r.interviews}</td>
                      <td className="px-4 py-4">
                        <span className={`font-bold ${r.hires > 0 ? 'text-green-600' : 'text-[#535E75]'}`}>{r.hires}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-mono font-semibold ${r.avgScore >= 75 ? 'text-green-600' : 'text-amber-600'}`}>
                          {r.avgScore}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[#E2E6EF] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#001CB0] to-[#0025E0] transition-all duration-300"
                              style={{ width: `${Math.min((r.screenings / Math.max(...a.recruiterStats.map(x => x.screenings))) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
