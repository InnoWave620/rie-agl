import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../lib/db';

interface DBApp {
  ApplicationID: number; ApplicantID: number; JobID: number;
  ApplicationStatus: string; CreatedDate: Date | string;
  FullName: string; Email: string; Phone: string | null;
  FinalScore: number | string | null; Recommendation: string | null;
  JobTitle: string | null;
}

// GET /api/applications — List recent applications
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const jobId = searchParams.get('jobId');

  try {
    const where = jobId ? `WHERE a.JobID = ${parseInt(jobId)}` : '';

    const rows = await query<DBApp>(`
      SELECT TOP ${Math.min(limit, 100)}
        a.ApplicationID, a.ApplicantID, a.JobID, a.ApplicationStatus, a.CreatedDate,
        ap.FullName, ap.Email, ap.Phone,
        ats.FinalScore, ats.Recommendation,
        j.Title AS JobTitle
      FROM Applications a
      JOIN  Applicants ap  ON ap.ApplicantID  = a.ApplicantID
      LEFT JOIN ATS_Scores ats ON ats.ApplicationID = a.ApplicationID
      LEFT JOIN Jobs j         ON j.JobID           = a.JobID
      ${where}
      ORDER BY a.CreatedDate DESC
    `);

    const data = rows.map(r => {
      const nameParts = (r.FullName ?? '').split(' ');
      const score = r.FinalScore != null ? parseFloat(String(r.FinalScore)) : undefined;
      const status = (r.ApplicationStatus ?? '').toLowerCase();
      const appStatus =
        status.includes('interview') ? 'interview_invited' :
        status.includes('hired')     ? 'hired' :
        status.includes('reject')    ? 'rejected' :
        status.includes('review')    ? 'hr_review' :
        score != null                ? 'scored' : 'pending';

      return {
        id:            String(r.ApplicationID),
        jobId:         String(r.JobID),
        jobTitle:      r.JobTitle ?? '',
        candidateId:   String(r.ApplicantID),
        candidate: {
          id:        String(r.ApplicantID),
          firstName: nameParts[0] ?? '',
          lastName:  nameParts.slice(1).join(' ') ?? '',
          email:     r.Email ?? '',
          phone:     r.Phone ?? undefined,
        },
        status:           appStatus,
        atsScore:         isNaN(score as number) ? undefined : score,
        decisionCategory:
          score != null && score >= 90 ? 'fast_track' :
          score != null && score >= 80 ? 'auto_invite' :
          score != null && score >= 70 ? 'hr_review'   :
          score != null && score >= 60 ? 'feedback'    :
          score != null               ? 'auto_reject'  : undefined,
        recommendation: r.Recommendation ?? undefined,
        consentGiven:  true,
        resumeFileName: 'resume.pdf',
        createdAt: r.CreatedDate ? new Date(r.CreatedDate).toISOString() : '',
        updatedAt: r.CreatedDate ? new Date(r.CreatedDate).toISOString() : '',
      };
    });

    return NextResponse.json({ success: true, data, meta: { total: data.length } });
  } catch (error) {
    console.error('[GET /api/applications]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/applications — Public application submission
export async function POST(req: NextRequest) {
  try {
    const formData     = await req.formData();
    const jobId        = formData.get('jobId')        as string;
    const firstName    = formData.get('firstName')    as string;
    const lastName     = formData.get('lastName')     as string;
    const email        = formData.get('email')        as string;
    const consentGiven = formData.get('consentGiven') === 'true';
    const resumeFile   = formData.get('resume')       as File | null;

    if (!jobId || !firstName || !lastName || !email || !consentGiven) {
      return NextResponse.json({ success: false, error: 'Missing required fields or consent not given' }, { status: 400 });
    }
    if (!resumeFile) {
      return NextResponse.json({ success: false, error: 'Resume file is required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId: `app-${Date.now()}`,
        status: 'pending',
        message: 'Application received. You will receive a confirmation email shortly.',
        estimatedReviewTime: '2-3 business days',
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
