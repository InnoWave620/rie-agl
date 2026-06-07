import { notFound } from 'next/navigation';
import Link from 'next/link';
import { query } from '../../lib/db';
import { formatDate, formatEmploymentType } from '../../lib/utils';
import { DivisionBadge } from '../../components/common/StatusBadge';
import { MapPin, Clock, Users, ChevronLeft, ArrowRight, Briefcase, Globe, Building2, ChevronRight } from 'lucide-react';
import type { Division, EmploymentType, ExperienceLevel } from '../../types';

interface Props { params: Promise<{ slug: string }> }

interface DBJob {
  JobID: number; Title: string; Department: string; Location: string;
  EmploymentType: string; Description: string; Requirements: string | null;
  Status: string; CreatedDate: Date | string;
}

function toEmploymentType(raw: string): EmploymentType {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('contract')) return 'contract';
  if (s.includes('intern'))   return 'internship';
  return 'full_time';
}

function toExpLevel(title: string): ExperienceLevel {
  const s = (title ?? '').toLowerCase();
  if (s.includes('director') || s.includes('executive') || s.includes('chief')) return 'Executive';
  if (s.includes('senior') || s.includes('manager') || s.includes('lead'))     return 'Senior';
  if (s.includes('junior') || s.includes('intern') || s.includes('entry'))     return 'Entry';
  return 'Mid';
}

function toDivision(dept: string): Division {
  const s = (dept ?? '').toLowerCase();
  if (s.includes('port')) return 'Port';
  if (s.includes('rail')) return 'Rail';
  return 'Logistics';
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;

  // slug is the JobID (see api/jobs/route.ts)
  const jobId = parseInt(slug);
  if (isNaN(jobId)) notFound();

  const [jobRows, countRows] = await Promise.all([
    query<DBJob>(`
      SELECT JobID, Title, Department, Location, EmploymentType,
             Description, Requirements, Status, CreatedDate
      FROM Jobs WHERE JobID = ${jobId} AND Status = 'Open'
    `).catch(() => [] as DBJob[]),
    query<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM Applications WHERE JobID = ${jobId}
    `).catch(() => [{ cnt: 0 }]),
  ]);

  if (!jobRows.length) notFound();

  const r = jobRows[0];
  const requirements = r.Requirements
    ? r.Requirements.split(/[\n;]+/).map(s => s.trim()).filter(Boolean)
    : [];
  const applicantCount = Number(countRows[0]?.cnt) || 0;

  const job = {
    id:              String(r.JobID),
    slug:            String(r.JobID),
    title:           r.Title ?? '',
    division:        toDivision(r.Department),
    location:        r.Location ?? '',
    country:         '',
    region:          'Southern Africa' as const,
    employmentType:  toEmploymentType(r.EmploymentType),
    experienceLevel: toExpLevel(r.Title ?? ''),
    status:          'published' as const,
    applicantCount,
    description:     r.Description ?? '',
    requirements,
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9]">

      {/* ── Sticky Dark Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0A0F24] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href="/careers"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            <span>All Jobs</span>
          </Link>
          <Link href="/careers" className="flex items-center gap-3.5 group">
            <img
              src="/AGL.logo.png"
              alt="AGL Logo"
              className="h-[48px] w-auto object-contain brightness-0 invert group-hover:scale-105 transition-transform duration-200"
            />
            <div>
              <div className="text-white font-bold text-base leading-tight tracking-wide">AGL Careers</div>
              <div className="text-white/40 text-xs leading-tight">Africa Global Logistics</div>
            </div>
          </Link>
        </div>
      </nav>

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/careers" className="hover:text-[#001CB0] transition-colors font-medium">Careers</Link>
          <ChevronRight size={14} />
          <span className="text-[#0A0F24] font-semibold truncate max-w-xs">{job.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ── Main Content (65%) ── */}
          <div className="space-y-6">

            {/* Header card */}
            <div className="card p-8">
              <div className="flex flex-wrap gap-2 mb-5">
                <DivisionBadge division={job.division} />
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#001CB0]/10 text-[#001CB0]">
                  {job.experienceLevel}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                  {formatEmploymentType(job.employmentType)}
                </span>
              </div>

              <h1 className="text-3xl font-black text-[#0A0F24] mb-4 leading-tight">{job.title}</h1>

              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {[
                  { icon: MapPin,    label: job.location || 'Africa' },
                  { icon: Users,     label: `${applicantCount} applicants` },
                  { icon: Briefcase, label: formatEmploymentType(job.employmentType) },
                  { icon: Building2, label: job.division },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                    <Icon size={14} className="text-[#001CB0]" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* About the Role */}
            <div className="card p-8">
              <h2 className="text-lg font-bold text-[#0A0F24] mb-2 pb-4 border-b border-gray-100 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full bg-[#001CB0] inline-block" />
                About the Role
              </h2>
              <div
                className="prose prose-sm max-w-none mt-4 text-gray-600 leading-relaxed [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul>li]:mb-1"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>

            {/* Requirements */}
            {requirements.length > 0 && (
              <div className="card p-8">
                <h2 className="text-lg font-bold text-[#0A0F24] mb-2 pb-4 border-b border-gray-100 flex items-center gap-2">
                  <span className="w-1 h-6 rounded-full bg-[#E66423] inline-block" />
                  Requirements
                </h2>
                <ul className="mt-4 space-y-3">
                  {requirements.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold bg-[#E66423]">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* POPIA Notice */}
            <div className="bg-[#001CB0]/5 border border-[#001CB0]/15 rounded-2xl p-5 text-xs leading-relaxed text-gray-500">
              <strong className="text-[#001CB0] font-semibold">POPIA Notice: </strong>
              Your personal information will be processed solely for recruitment purposes at Africa Global Logistics.
              By applying, you consent to the processing of your personal data in accordance with the Protection of Personal Information Act (POPIA).
              Your data will be retained for 12 months and then securely deleted.
            </div>
          </div>

          {/* ── Right Sticky Apply Card (35%) ── */}
          <div className="lg:sticky lg:top-[80px] space-y-5">

            {/* Main Apply CTA Card */}
            <div className="card p-7 shadow-xl">
              <div className="text-center mb-6">
                <div className="text-xl font-black text-[#0A0F24] mb-1">Ready to Apply?</div>
                <p className="text-sm text-gray-400 font-medium">No account needed. Apply as a guest in minutes.</p>
              </div>

              <Link
                href={`/careers/${job.slug}/apply`}
                className="flex items-center justify-center gap-2.5 w-full py-4 rounded-xl text-sm font-bold text-white bg-[#001CB0] hover:bg-[#0020CC] shadow-lg shadow-[#001CB0]/25 transition-all duration-200 hover:shadow-[#001CB0]/40 hover:-translate-y-0.5"
              >
                Apply Now
                <ArrowRight size={16} />
              </Link>

              <p className="text-center text-xs text-gray-400 mt-3 font-medium">Estimated 5 minutes to complete</p>
            </div>

            {/* Job Details Card */}
            <div className="card p-6">
              <h3 className="font-bold text-sm text-[#0A0F24] mb-4 pb-3 border-b border-gray-100">Job Details</h3>
              <div className="space-y-4">
                {[
                  { icon: Building2,  label: 'Division',    value: job.division },
                  { icon: MapPin,     label: 'Location',    value: job.location || 'Africa' },
                  { icon: Briefcase,  label: 'Type',        value: formatEmploymentType(job.employmentType) },
                  { icon: Clock,      label: 'Level',       value: job.experienceLevel },
                  { icon: Users,      label: 'Applicants',  value: `${applicantCount}` },
                ].map(detail => (
                  <div key={detail.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400 font-medium">
                      <detail.icon size={13} className="text-[#001CB0]" />
                      {detail.label}
                    </span>
                    <span className="font-semibold text-[#0A0F24]">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* About AGL card */}
            <div className="bg-gradient-to-br from-[#0A0F24] to-[#001CB0] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2.5 mb-3">
                <img
                  src="/AGL.logo.png"
                  alt="AGL Logo"
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
                <span className="font-bold text-sm">About AGL</span>
              </div>
              <p className="text-xs leading-relaxed text-white/60">
                Africa Global Logistics is the leading port operator, logistics provider, and rail concession holder in Africa,
                with operations in 51 countries, 24 port concessions, and 23,000+ employees.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[#E66423] text-xs font-semibold">
                <Globe size={12} />
                51 Countries · 23,000+ Employees
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
