import { NextRequest, NextResponse } from 'next/server';
import { execute } from '../../../lib/db';

interface Params { params: Promise<{ id: string }> }

interface DBJob {
  JobID: number; Title: string; Department: string; Location: string;
  EmploymentType: string; Description: string; Requirements: string | null;
  SalaryMin: number | null; SalaryMax: number | null; Status: string;
  CreatedDate: Date | string; ApplicationCount: number | string;
}

interface DBApplication {
  ApplicationID: number; ApplicantID: number; JobID: number;
  ApplicationStatus: string; CreatedDate: Date | string;
  FullName: string; Email: string; Phone: string | null; Location: string | null;
  FinalScore: number | string | null; Recommendation: string | null;
  AISummary: string | null; Strengths: string | null; Weaknesses: string | null;
}

function toStatus(raw: string) {
  const s = (raw ?? '').toLowerCase();
  if (s === 'open')   return 'published';
  if (s === 'closed') return 'closed';
  return 'draft';
}

function toEmploymentType(raw: string) {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('contract')) return 'contract';
  if (s.includes('intern'))   return 'internship';
  return 'full_time';
}

function mapApplication(row: DBApplication) {
  const nameParts = (row.FullName ?? '').split(' ');
  const score = row.FinalScore != null ? parseFloat(String(row.FinalScore)) : undefined;
  const status = (row.ApplicationStatus ?? '').toLowerCase();
  const appStatus =
    status.includes('interview') ? 'interview_invited' :
    status.includes('hired')     ? 'hired' :
    status.includes('reject')    ? 'rejected' :
    status.includes('review')    ? 'hr_review' :
    status.includes('score') && score != null ? 'scored' :
    'pending';

  return {
    id:            String(row.ApplicationID),
    jobId:         String(row.JobID),
    candidateId:   String(row.ApplicantID),
    candidate: {
      id:        String(row.ApplicantID),
      firstName: nameParts[0] ?? '',
      lastName:  nameParts.slice(1).join(' ') ?? '',
      email:     row.Email ?? '',
      phone:     row.Phone ?? undefined,
      location:  row.Location ?? undefined,
      createdAt: '',
    },
    status:          appStatus,
    atsScore:        isNaN(score as number) ? undefined : score,
    decisionCategory:
      score != null && score >= 90 ? 'fast_track' :
      score != null && score >= 80 ? 'auto_invite' :
      score != null && score >= 70 ? 'hr_review' :
      score != null && score >= 60 ? 'feedback' :
      score != null               ? 'auto_reject' : undefined,
    scoringResult: row.AISummary ? {
      id: `sr-${row.ApplicationID}`,
      applicationId: String(row.ApplicationID),
      overallScore: score ?? 0,
      aiSummary: row.AISummary,
      redFlags: [],
      recommendation: score != null && score >= 90 ? 'fast_track' :
        score != null && score >= 80 ? 'auto_invite' :
        score != null && score >= 70 ? 'hr_review' : 'feedback',
      skillsMatch:      { score: 0, weight: 0.35, weighted: 0, matchedSkills: [], missingSkills: [] },
      experienceMatch:  { score: 0, weight: 0.25, weighted: 0, relevantYears: 0 },
      education:        { score: 0, weight: 0.15, weighted: 0, degrees: [] },
      certifications:   { score: 0, weight: 0.10, weighted: 0, found: [] },
      semanticAi:       { score: 0, weight: 0.10, weighted: 0, assessment: '' },
      resumeQuality:    { score: 0, weight: 0.05, weighted: 0, strengths: row.Strengths ?? '', weaknesses: row.Weaknesses ?? '' },
      createdAt: row.CreatedDate ? new Date(row.CreatedDate).toISOString() : '',
    } : undefined,
    consentGiven: true,
    resumeFileName: 'resume.pdf',
    createdAt: row.CreatedDate ? new Date(row.CreatedDate).toISOString() : '',
    updatedAt: row.CreatedDate ? new Date(row.CreatedDate).toISOString() : '',
  };
}

// GET /api/jobs/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const jobId = parseInt(id);
  if (isNaN(jobId)) {
    return NextResponse.json({ success: false, error: 'Invalid job ID' }, { status: 400 });
  }

  try {
    const [jobRows, appRows] = await Promise.all([
      execute<DBJob>(`
        SELECT j.JobID, j.Title, j.Department, j.Location, j.EmploymentType,
          j.Description, j.Requirements, j.SalaryMin, j.SalaryMax, j.Status, j.CreatedDate,
          COUNT(a.ApplicationID) AS ApplicationCount
        FROM Jobs j
        LEFT JOIN Applications a ON a.JobID = j.JobID
        WHERE j.JobID = ?
        GROUP BY j.JobID, j.Title, j.Department, j.Location, j.EmploymentType,
          j.Description, j.Requirements, j.SalaryMin, j.SalaryMax, j.Status, j.CreatedDate
      `, [jobId]),
      execute<DBApplication>(`
        SELECT
          a.ApplicationID, a.ApplicantID, a.JobID, a.ApplicationStatus, a.CreatedDate,
          ap.FullName, ap.Email, ap.Phone, ap.Location,
          ats.FinalScore, ats.Recommendation,
          ai.AISummary, ai.Strengths, ai.Weaknesses
        FROM Applications a
        JOIN Applicants ap ON ap.ApplicantID = a.ApplicantID
        LEFT JOIN ATS_Scores ats ON ats.ApplicationID = a.ApplicationID
        LEFT JOIN AI_Evaluations ai ON ai.ApplicationID = a.ApplicationID
        WHERE a.JobID = ?
        ORDER BY a.CreatedDate DESC
      `, [jobId]),
    ]);

    if (!jobRows.length) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const row = jobRows[0];
    const job = {
      id: String(row.JobID),
      title: row.Title ?? '',
      slug: (row.Title ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: (row.Description ?? '').replace(/<[^>]+>/g, '').slice(0, 200) || row.Title,
      description: row.Description ?? '',
      requirements: row.Requirements
        ? [{ category: 'Requirements', items: row.Requirements.split(/[\n;]+/).map((s: string) => s.trim()).filter(Boolean) }]
        : [],
      division: row.Department ?? '',
      region: '',
      location: row.Location ?? '',
      country: '',
      employmentType: toEmploymentType(row.EmploymentType),
      experienceLevel: 'Mid',
      status: toStatus(row.Status),
      createdBy: 'user-001',
      applicantCount: Number(row.ApplicationCount) || 0,
      createdAt: row.CreatedDate ? new Date(row.CreatedDate).toISOString() : '',
      updatedAt: row.CreatedDate ? new Date(row.CreatedDate).toISOString() : '',
    };

    return NextResponse.json({
      success: true,
      data: { ...job, applicants: appRows.map(mapApplication) },
    });
  } catch (error) {
    console.error('[GET /api/jobs/:id]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// PATCH /api/jobs/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const jobId = parseInt(id);
  if (isNaN(jobId)) {
    return NextResponse.json({ success: false, error: 'Invalid job ID' }, { status: 400 });
  }

  try {
    const body = await req.json();

    const sets: string[] = [];
    const params: unknown[] = [];

    if (body.title !== undefined) {
      sets.push('Title = ?');
      params.push(body.title);
    }
    if (body.division !== undefined) {
      sets.push('Department = ?');
      params.push(body.division);
    }
    if (body.description !== undefined) {
      sets.push('Description = ?');
      params.push(body.description);
    }
    if (body.requirements !== undefined) {
      sets.push('Requirements = ?');
      params.push(body.requirements || null);
    }
    if (body.salaryMin !== undefined) {
      sets.push('SalaryMin = ?');
      params.push(body.salaryMin ? Number(body.salaryMin) : null);
    }
    if (body.salaryMax !== undefined) {
      sets.push('SalaryMax = ?');
      params.push(body.salaryMax ? Number(body.salaryMax) : null);
    }

    if (body.location !== undefined || body.country !== undefined) {
      const loc   = String(body.location ?? '').trim();
      const cntry = String(body.country  ?? '').trim();
      sets.push('Location = ?');
      params.push([loc, cntry].filter(Boolean).join(', '));
    }
    if (body.employmentType !== undefined) {
      const et = body.employmentType === 'contract'   ? 'Contract' :
                 body.employmentType === 'internship' ? 'Internship' : 'Full Time';
      sets.push('EmploymentType = ?');
      params.push(et);
    }
    if (body.status !== undefined) {
      const dbStatus = body.status === 'published' ? 'Open' :
                       body.status === 'closed'    ? 'Closed' : 'Draft';
      sets.push('Status = ?');
      params.push(dbStatus);
    }

    if (sets.length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    params.push(jobId);
    await execute(`UPDATE Jobs SET ${sets.join(', ')} WHERE JobID = ?`, params);

    return NextResponse.json({ success: true, data: { id, ...body, updatedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('[PATCH /api/jobs/:id]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// DELETE /api/jobs/:id (archive)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const jobId = parseInt(id);
  if (isNaN(jobId)) {
    return NextResponse.json({ success: false, error: 'Invalid job ID' }, { status: 400 });
  }
  try {
    await execute("UPDATE Jobs SET Status = 'Closed' WHERE JobID = ?", [jobId]);
    return NextResponse.json({ success: true, message: 'Job archived', data: { id, status: 'closed' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
