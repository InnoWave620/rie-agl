import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '../../lib/db';
import { uploadCV } from '../../lib/s3';
import { addApplicationJob } from '../../lib/queue';

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
    const where = jobId ? 'WHERE a.JobID = ?' : '';
    const params = jobId ? [parseInt(jobId)] : [];

    const rows = await execute<DBApp>(`
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
    `, params);

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
    const phone        = (formData.get('phone')       as string) || null;
    const location     = (formData.get('location')    as string) || null;
    const consentGiven = formData.get('consentGiven') === 'true';
    const resumeFile   = formData.get('resume')       as File | null;

    if (!jobId || !firstName || !lastName || !email || !consentGiven) {
      return NextResponse.json({ success: false, error: 'Missing required fields or consent not given' }, { status: 400 });
    }
    if (!resumeFile) {
      return NextResponse.json({ success: false, error: 'Resume file is required' }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // 1. Look up or insert candidate in Applicants
    const existing = await execute<{ ApplicantID: number }>(
      'SELECT ApplicantID FROM Applicants WHERE Email = ?',
      [emailLower]
    );

    let applicantId: number;
    if (existing.length > 0) {
      applicantId = existing[0].ApplicantID;
      await execute(
        'UPDATE Applicants SET FullName = ?, Phone = ?, Location = ? WHERE ApplicantID = ?',
        [fullName, phone, location, applicantId]
      );
    } else {
      const inserted = await execute<{ ApplicantID: number }>(
        `INSERT INTO Applicants (FullName, Email, Phone, Location, CreatedDate)
         OUTPUT INSERTED.ApplicantID
         VALUES (?, ?, ?, ?, GETDATE())`,
        [fullName, emailLower, phone, location]
      );
      applicantId = inserted[0].ApplicantID;
    }

    // 2. Upload file buffer to AWS S3 (AES-256 encrypted)
    const arrayBuffer = await resumeFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const s3Url = await uploadCV(fileBuffer, resumeFile.name, resumeFile.type);

    // 3. Write resume record to Resumes table
    await execute('DELETE FROM Resumes WHERE ApplicantID = ?', [applicantId]);
    await execute(
      'INSERT INTO Resumes (ApplicantID, CVUrl, FileName, UploadedDate) VALUES (?, ?, ?, GETDATE())',
      [applicantId, s3Url, resumeFile.name]
    );

    // 4. Create new Application record
    const appRows = await execute<{ ApplicationID: number }>(
      `INSERT INTO Applications (ApplicantID, JobID, ApplicationStatus, CreatedDate)
       OUTPUT INSERTED.ApplicationID
       VALUES (?, ?, 'pending', GETDATE())`,
      [applicantId, parseInt(jobId)]
    );
    const applicationId = appRows[0].ApplicationID;

    // 5. Dispatch background AI assessment job via BullMQ queue
    await addApplicationJob(String(applicationId));

    return NextResponse.json({
      success: true,
      data: {
        applicationId: String(applicationId),
        status: 'pending',
        message: 'Application received. You will receive a confirmation email shortly.',
        estimatedReviewTime: '2-3 business days',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/applications] Submission failed:', error);
    return NextResponse.json({ success: false, error: 'Server error: ' + String(error) }, { status: 500 });
  }
}
