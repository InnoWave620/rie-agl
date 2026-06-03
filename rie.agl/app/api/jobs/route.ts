import { NextRequest, NextResponse } from 'next/server';
import { query, esc } from '../../lib/db';
import type { Division, Region, EmploymentType, JobStatus, ExperienceLevel, JobRequirement } from '../../types';

// ── Mappers ──────────────────────────────────────────────────────────────────

function toSlug(title: string, location?: string): string {
  return `${title}${location ? ` ${location}` : ''}`
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
}

function toEmploymentType(raw: string): EmploymentType {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('contract'))  return 'contract';
  if (s.includes('intern'))    return 'internship';
  return 'full_time';
}

function toStatus(raw: string): JobStatus {
  const s = (raw ?? '').toLowerCase();
  if (s === 'open')   return 'published';
  if (s === 'closed') return 'closed';
  if (s === 'draft')  return 'draft';
  return 'draft';
}

function toDivision(dept: string): Division {
  const s = (dept ?? '').toLowerCase();
  if (s.includes('port'))      return 'Port';
  if (s.includes('rail'))      return 'Rail';
  if (s.includes('logistics')) return 'Logistics';
  return 'Logistics';
}

function toRegion(location: string): Region {
  const s = (location ?? '').toLowerCase();
  if (s.includes('nairobi') || s.includes('mombasa') || s.includes('dar es') || s.includes('kampala')) return 'East Africa';
  if (s.includes('johannesburg') || s.includes('cape town') || s.includes('durban') || s.includes('lusaka') || s.includes('harare')) return 'Southern Africa';
  if (s.includes('casablanca') || s.includes('cairo') || s.includes('tunis')) return 'North Africa';
  if (s.includes('brazzaville') || s.includes('kinshasa') || s.includes('douala')) return 'Central Africa';
  return 'West Africa';
}

function parseRequirements(raw: string | null): JobRequirement[] {
  if (!raw) return [];
  const items = raw.split(/[\n;]+/).map(s => s.trim()).filter(Boolean);
  return items.length ? [{ category: 'Requirements', items }] : [];
}

function toExperienceLevel(title: string): ExperienceLevel {
  const s = (title ?? '').toLowerCase();
  if (s.includes('director') || s.includes('executive') || s.includes('chief') || s.includes('vp')) return 'Executive';
  if (s.includes('senior') || s.includes('manager') || s.includes('lead')) return 'Senior';
  if (s.includes('junior') || s.includes('intern') || s.includes('entry')) return 'Entry';
  return 'Mid';
}

interface DBJob {
  JobID: number;
  Title: string;
  Department: string;
  Location: string;
  EmploymentType: string;
  Description: string;
  Requirements: string | null;
  SalaryMin: number | null;
  SalaryMax: number | null;
  Status: string;
  CreatedDate: Date | string;
  ApplicationCount: number | string;
}

function mapJob(row: DBJob) {
  const location = row.Location ?? '';
  const desc = row.Description ?? '';
  return {
    id:              String(row.JobID),
    title:           row.Title ?? '',
    slug:            String(row.JobID),
    summary:         desc.replace(/<[^>]+>/g, '').slice(0, 200) || row.Title,
    description:     desc,
    requirements:    parseRequirements(row.Requirements),
    division:        toDivision(row.Department),
    region:          toRegion(location),
    location,
    country:         '',
    employmentType:  toEmploymentType(row.EmploymentType),
    experienceLevel: toExperienceLevel(row.Title ?? ''),
    status:          toStatus(row.Status),
    createdBy:       'user-001',
    applicantCount:  Number(row.ApplicationCount) || 0,
    salaryMin:       row.SalaryMin ?? null,
    salaryMax:       row.SalaryMax ?? null,
    createdAt:       row.CreatedDate ? new Date(row.CreatedDate).toISOString() : new Date().toISOString(),
    updatedAt:       row.CreatedDate ? new Date(row.CreatedDate).toISOString() : new Date().toISOString(),
  };
}

// ── GET /api/jobs ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status    = searchParams.get('status');
    const division  = searchParams.get('division');
    const publicOnly = searchParams.get('public') === 'true';

    // Build WHERE clause
    const conditions: string[] = [];
    if (publicOnly || status === 'published') conditions.push(`j.Status = 'Open'`);
    else if (status === 'draft')              conditions.push(`j.Status = 'Draft'`);
    else if (status === 'closed')             conditions.push(`j.Status = 'Closed'`);
    if (division && division !== 'all')       conditions.push(`j.Department = '${division.replace(/'/g, "''")}'`);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query<DBJob>(`
      SELECT
        j.JobID, j.Title, j.Department, j.Location, j.EmploymentType,
        j.Description, j.Requirements, j.SalaryMin, j.SalaryMax, j.Status, j.CreatedDate,
        COUNT(a.ApplicationID) AS ApplicationCount
      FROM Jobs j
      LEFT JOIN Applications a ON a.JobID = j.JobID
      ${where}
      GROUP BY
        j.JobID, j.Title, j.Department, j.Location, j.EmploymentType,
        j.Description, j.Requirements, j.SalaryMin, j.SalaryMax, j.Status, j.CreatedDate
      ORDER BY j.CreatedDate DESC
    `);

    const jobs = rows.map(mapJob);
    return NextResponse.json({ success: true, data: jobs, meta: { total: jobs.length } });
  } catch (error) {
    console.error('[GET /api/jobs]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// ── POST /api/jobs ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Map app fields → DB columns
    const title        = String(body.title       ?? '').trim();
    const department   = String(body.division    ?? '').trim();
    const location     = String(body.location    ?? '').trim();
    const country      = String(body.country     ?? '').trim();
    const empType      = body.employmentType === 'contract'   ? 'Contract' :
                         body.employmentType === 'internship' ? 'Internship' : 'Full Time';
    const description  = String(body.description  ?? '').trim();
    const requirements = String(body.requirements ?? '').trim();
    const status       = body.status === 'published' ? 'Open' : 'Draft';
    const locationFull = [location, country].filter(Boolean).join(', ');
    const salaryMin    = body.salaryMin ? Number(body.salaryMin) : null;
    const salaryMax    = body.salaryMax ? Number(body.salaryMax) : null;
    // CreatedBy: use UserID 1 (first admin) — replace with session.userId when auth is wired
    const createdBy    = 1;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const rows = await query<{ JobID: number }>(`
      INSERT INTO Jobs
        (Title, Department, Location, EmploymentType, Description, Requirements,
         SalaryMin, SalaryMax, Status, CreatedBy, CreatedDate)
      OUTPUT INSERTED.JobID
      VALUES (
        ${esc(title)},
        ${esc(department)},
        ${esc(locationFull)},
        ${esc(empType)},
        ${esc(description)},
        ${esc(requirements || null)},
        ${salaryMin ?? 'NULL'},
        ${salaryMax ?? 'NULL'},
        ${esc(status)},
        ${createdBy},
        GETDATE()
      )
    `);

    const newId = rows[0]?.JobID;

    return NextResponse.json({
      success: true,
      data: { id: String(newId), slug: String(newId), title, status: toStatus(status) },
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/jobs]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
