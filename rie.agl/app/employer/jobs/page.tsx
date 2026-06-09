'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/layout/Header';
import JobCard from '../../components/jobs/JobCard';
import type { Job, JobStatus, Division } from '../../types';
import { Search, Plus, Grid, List, Loader2, Briefcase, ChevronDown, AlertCircle, Trash2, X } from 'lucide-react';

const STATUSES: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft',     label: 'Draft' },
  { value: 'closed',    label: 'Closed' },
];

const DIVISIONS: { value: Division | 'all'; label: string }[] = [
  { value: 'all',       label: 'All Divisions' },
  { value: 'Port',      label: 'Port' },
  { value: 'Rail',      label: 'Rail' },
  { value: 'Logistics', label: 'Logistics' },
];

export default function JobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState<JobStatus | 'all'>('all');
  const [division, setDivision] = useState<Division | 'all'>('all');
  const [view,     setView]     = useState<'grid' | 'list'>('grid');

  const [session, setSession] = useState<any>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    fetch('/api/auth')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.user) {
          setSession(d.data.user);
        }
      });

    fetch('/api/jobs')
      .then(r => r.json())
      .then(data => {
        if (data.success) setJobs(data.data);
        else setError(data.error ?? 'Failed to load jobs');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(job => {
    if (status   !== 'all' && job.status   !== status)   return false;
    if (division !== 'all' && job.division !== division) return false;
    if (search) {
      const q = search.toLowerCase();
      return job.title.toLowerCase().includes(q) || job.location.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all:       jobs.length,
    published: jobs.filter(j => j.status === 'published').length,
    draft:     jobs.filter(j => j.status === 'draft').length,
    closed:    jobs.filter(j => j.status === 'closed').length,
  };

  const isAdmin = session?.role === 'admin';

  const handleDeleteJobClick = (jobId: string) => {
    setDeletingJobId(jobId);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingJobId) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/jobs/${deletingJobId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setJobs(jobs.filter(j => j.id !== deletingJobId));
        setShowDeleteModal(false);
        setDeletingJobId(null);
      } else {
        setDeleteError(data.error ?? 'Failed to archive job.');
      }
    } catch {
      setDeleteError('Network error archiving job.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-[#E2E6EF] px-8 py-5">
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[#0A0F24]">Job Management</h1>
            <p className="text-sm text-[#535E75] mt-0.5">Create and manage your job postings</p>
          </div>
          <Link
            href="/employer/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#edc047] text-[#1b365f] text-sm font-bold shadow-sm hover:bg-[#e0b236] transition-all duration-200"
          >
            <Plus size={15} />
            New Job
          </Link>
        </div>
      </div>

      <main className="flex-1 p-8 overflow-auto bg-[#F4F6F9]">
        <div className="max-w-[1400px] mx-auto w-full">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Status Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-[#E2E6EF] bg-white shadow-sm">
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  status === s.value
                    ? 'bg-[#edc047] text-[#1b365f] font-bold'
                    : 'text-[#535E75] hover:bg-[#F4F6F9]'
                }`}
              >
                {s.label}
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                    status === s.value
                      ? 'bg-[#1b365f]/15 text-[#1b365f]'
                      : 'bg-[#F4F6F9] text-[#535E75]'
                  }`}
                >
                  {counts[s.value as keyof typeof counts] ?? filtered.length}
                </span>
              </button>
            ))}
          </div>

          {/* Division Select */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-[#E2E6EF] rounded-xl px-4 py-2.5 pr-9 text-sm text-[#0A0F24] font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1b365f]/20 focus:border-[#1b365f] transition-all duration-200 cursor-pointer"
              value={division}
              onChange={e => setDivision(e.target.value as Division | 'all')}
            >
              {DIVISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#535E75] pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#535E75]" />
            <input
              className="w-full bg-white border border-[#E2E6EF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0A0F24] placeholder:text-[#535E75] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1b365f]/20 focus:border-[#1b365f] transition-all duration-200"
              placeholder="Search jobs by title or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="ml-auto flex items-center gap-1 bg-white border border-[#E2E6EF] rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                view === 'grid'
                  ? 'bg-[#edc047] text-[#1b365f] shadow-sm'
                  : 'text-[#535E75] hover:bg-[#F4F6F9]'
              }`}
              title="Grid view"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                view === 'list'
                  ? 'bg-[#edc047] text-[#1b365f] shadow-sm'
                  : 'text-[#535E75] hover:bg-[#F4F6F9]'
              }`}
              title="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E6EF] shadow-sm p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E2E6EF] rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#E2E6EF] rounded-lg w-3/4" />
                    <div className="h-3 bg-[#E2E6EF] rounded-lg w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-[#E2E6EF] rounded-lg w-full" />
                  <div className="h-3 bg-[#E2E6EF] rounded-lg w-5/6" />
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="h-6 bg-[#E2E6EF] rounded-full w-16" />
                  <div className="h-6 bg-[#E2E6EF] rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500"><AlertCircle size={28} /></div>
            <p className="text-sm font-semibold text-red-600">{error}</p>
          </div>
        )}

        {/* Job Cards */}
        {!loading && !error && filtered.length > 0 && (
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
            {filtered.map((job, i) => (
              <div
                key={job.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <JobCard
                  job={job}
                  variant="employer"
                  onDelete={isAdmin ? handleDeleteJobClick : undefined}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#F4F6F9] border border-[#E2E6EF] flex items-center justify-center">
              <Briefcase size={32} className="text-[#535E75]" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#0A0F24] mb-1">No jobs found</h3>
              <p className="text-sm text-[#535E75] max-w-xs">
                {jobs.length === 0
                  ? 'No jobs in the database yet. Create your first job posting.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
            <Link
              href="/employer/jobs/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#edc047] text-[#1b365f] text-sm font-bold shadow-sm hover:bg-[#e0b236] transition-all duration-200"
            >
              <Plus size={15} />
              Create Job Posting
            </Link>
          </div>
        )}
        </div>
      </main>
      {/* ── Delete Job Modal ── */}
      {showDeleteModal && deletingJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0F24]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-150 overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-red-600 flex items-center gap-2 text-base">
                <AlertCircle size={18} /> Archive/Delete Job Posting
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDeleteJobSubmit}>
              <div className="px-6 py-5 space-y-4">
                {deleteError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold bg-red-50 border border-red-150 text-red-600">
                    <AlertCircle size={14} className="shrink-0" />
                    {deleteError}
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-3">
                  <p>
                    Are you sure you want to close and archive the job posting <span className="font-bold text-[#0A0F24]">"{jobs.find(j => j.id === deletingJobId)?.title}"</span>?
                  </p>
                  <p className="leading-relaxed">
                    This will set the job status to <span className="font-semibold text-gray-800">'Closed'</span>. It will be removed from the public careers site, and new candidates won't be able to apply. Existing applicant logs will remain preserved.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-150 hover:text-gray-800 transition-all"
                  disabled={deleteSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/25 transition-all disabled:opacity-50"
                >
                  {deleteSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Closing…
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Close/Archive
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
