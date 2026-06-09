import Link from 'next/link';
import type { Job } from '../../types';
import { DivisionBadge, JobStatusBadge } from '../common/StatusBadge';
import { formatDate, formatRelativeTime, formatEmploymentType, pluralize } from '../../lib/utils';
import { MapPin, Clock, Users, ArrowRight, Briefcase, Trash2 } from 'lucide-react';

interface JobCardProps {
  job: Job;
  variant?: 'public' | 'employer';
  onDelete?: (jobId: string) => void;
}

export default function JobCard({ job, variant = 'public', onDelete }: JobCardProps) {
  const href = variant === 'public'
    ? `/careers/${job.slug}`
    : `/employer/jobs/${job.id}`;

  return (
    <div className="job-card card-hover group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex gap-2 flex-wrap">
          <DivisionBadge division={job.division} variant={variant} />
          <span
            className="badge font-bold"
            style={{ background: '#e0f2fe', color: '#087ebf' }}
          >
            {job.experienceLevel}
          </span>
        </div>
        {variant === 'employer' && <JobStatusBadge status={job.status} />}
        {variant === 'public' && (
          <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>
            {job.publishedAt || job.createdAt ? formatRelativeTime(job.publishedAt || job.createdAt) : 'Recent'}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-lg mb-1 group-hover:text-navy transition-colors" style={{ color: '#142440' }}>
        {job.title}
      </h3>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
          <MapPin size={13} />
          {job.location}, {job.country}
        </div>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
          <Briefcase size={13} />
          {formatEmploymentType(job.employmentType)}
        </div>
        {job.closingDate && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#9CA3AF' }}>
            <Clock size={13} />
            Closes {formatDate(job.closingDate)}
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-sm mb-4 line-clamp-2" style={{ color: '#4B5563' }}>
        {job.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
        {variant === 'employer' ? (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
            <Users size={14} />
            <span>{pluralize(job.applicantCount, 'applicant')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#9CA3AF' }}>
            <span>{job.region}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {variant === 'employer' && onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(job.id);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Delete Job"
            >
              <Trash2 size={15} />
            </button>
          )}
          <Link
            href={href}
            className="btn btn-sm font-bold"
            style={{
              background: '#edc047',
              color: '#1b365f',
            }}
          >
            {variant === 'public' ? 'View & Apply' : 'Manage'}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
