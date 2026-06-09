import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/db';

interface Params { params: Promise<{ id: string }> }

// GET /api/candidates/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const applicantId = parseInt(id);
  if (isNaN(applicantId)) {
    return NextResponse.json({ success: false, error: 'Invalid candidate ID' }, { status: 404 });
  }

  try {
    interface DBRow {
      ApplicantID: number; FullName: string; Email: string;
      Phone: string | null; Location: string | null; ApplicantCreatedDate: Date | string;
      ApplicationID: number | null; JobID: number | null; ApplicationStatus: string | null;
      AppCreatedDate: Date | string | null; FinalScore: number | string | null;
      Recommendation: string | null; AISummary: string | null;
      Strengths: string | null; Weaknesses: string | null; JobTitle: string | null;
      Notes: string | null;
    }

    const rows = await query<DBRow>(`
      SELECT
        ap.ApplicantID, ap.FullName, ap.Email, ap.Phone, ap.Location,
        ap.CreatedDate AS ApplicantCreatedDate,
        a.ApplicationID, a.JobID, a.ApplicationStatus, a.Notes,
        a.CreatedDate  AS AppCreatedDate,
        ats.FinalScore, ats.Recommendation,
        ai.AISummary, ai.Strengths, ai.Weaknesses,
        j.Title AS JobTitle
      FROM Applicants ap
      LEFT JOIN Applications a   ON a.ApplicantID = ap.ApplicantID
      LEFT JOIN ATS_Scores ats   ON ats.ApplicationID = a.ApplicationID
      LEFT JOIN AI_Evaluations ai ON ai.ApplicationID = a.ApplicationID
      LEFT JOIN Jobs j           ON j.JobID = a.JobID
      WHERE ap.ApplicantID = ${applicantId}
    `);

    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    const base = rows[0];
    const nameParts = (base.FullName ?? '').split(' ');
    const candidate = {
      id:        String(base.ApplicantID),
      firstName: nameParts[0] ?? '',
      lastName:  nameParts.slice(1).join(' ') ?? '',
      email:     base.Email ?? '',
      phone:     base.Phone ?? undefined,
      location:  base.Location ?? undefined,
      createdAt: base.ApplicantCreatedDate
        ? new Date(base.ApplicantCreatedDate).toISOString() : '',
      applications: rows
        .filter(r => r.ApplicationID != null)
        .map(r => {
          const score = r.FinalScore != null ? parseFloat(String(r.FinalScore)) : undefined;
          return {
            id:            String(r.ApplicationID),
            jobId:         String(r.JobID),
            candidateId:   String(base.ApplicantID),
            jobTitle:      r.JobTitle ?? '',
            status:        r.ApplicationStatus ?? 'pending',
            atsScore:      score,
            recommendation: r.Recommendation ?? undefined,
            aiSummary:     r.AISummary ?? undefined,
            strengths:     r.Strengths ?? undefined,
            weaknesses:    r.Weaknesses ?? undefined,
            notes:         r.Notes ?? undefined,
            consentGiven:  true,
            resumeFileName: 'resume.pdf',
            createdAt:     r.AppCreatedDate ? new Date(r.AppCreatedDate).toISOString() : '',
            updatedAt:     r.AppCreatedDate ? new Date(r.AppCreatedDate).toISOString() : '',
          };
        }),
    };

    return NextResponse.json({ success: true, data: candidate });
  } catch (error) {
    console.error('[GET /api/candidates/:id]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/candidates/:id/decision — Manual override
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { action, applicationId, notes } = await req.json();

  const validActions = ['promote', 'reject', 're-evaluate', 'invite'];
  if (!validActions.includes(action)) {
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }

  // TODO: UPDATE Applications SET ApplicationStatus = ... WHERE ApplicationID = applicationId
  return NextResponse.json({
    success: true,
    message: `Candidate ${action} action recorded`,
    data: { candidateId: id, applicationId, action, notes, timestamp: new Date().toISOString() },
  });
}
