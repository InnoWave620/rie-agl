import { NextRequest, NextResponse } from 'next/server';
import { execute } from '../../../../lib/db';
import { sendEmail } from '../../../../lib/email';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const jobId = parseInt(id);

  if (isNaN(jobId)) {
    return NextResponse.json({ success: false, error: 'Invalid Job ID' }, { status: 400 });
  }

  try {
    // Count existing invited candidates to enforce the limit of 20
    const existingInvites = await execute<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM Applications WHERE JobID = ? AND ApplicationStatus = 'interview_invited'
    `, [jobId]);
    const currentInvitedCount = existingInvites[0]?.cnt ?? 0;

    if (currentInvitedCount >= 20) {
      return NextResponse.json({
        success: false,
        message: 'The maximum limit of 20 interview invitations has already been reached for this job.',
      });
    }

    const remainingCapacity = 20 - currentInvitedCount;

    // 1. Find all applications for this job that have an ATS score >= 80
    // and whose status is NOT already 'interview_invited', 'rejected', or 'hired'
    // Order by score DESC so we invite the highest scoring candidates first
    interface EligibleApp {
      ApplicationID: number;
      ApplicantID: number;
      FullName: string;
      Email: string;
      JobTitle: string;
      FinalScore: number;
    }

    const eligibleApps = await execute<EligibleApp>(`
      SELECT a.ApplicationID, a.ApplicantID, ap.FullName, ap.Email, j.Title as JobTitle, ats.FinalScore
      FROM Applications a
      JOIN Applicants ap ON ap.ApplicantID = a.ApplicantID
      JOIN Jobs j ON j.JobID = a.JobID
      JOIN ATS_Scores ats ON ats.ApplicationID = a.ApplicationID
      WHERE a.JobID = ?
        AND ats.FinalScore >= 80
        AND a.ApplicationStatus IN ('pending', 'hr_review', 'scoring', 'scored')
      ORDER BY ats.FinalScore DESC
    `, [jobId]);

    if (eligibleApps.length === 0) {
      return NextResponse.json({ success: false, message: 'No eligible top candidates to invite.' });
    }

    const appsToInvite = eligibleApps.slice(0, remainingCapacity);

    // 2. Perform bulk updates and inserts
    for (const app of appsToInvite) {
      // Update Application status to 'interview_invited'
      await execute(
        "UPDATE Applications SET ApplicationStatus = 'interview_invited' WHERE ApplicationID = ?",
        [app.ApplicationID]
      );

      // Create an Interview Invitation record if not exists
      const existingInvite = await execute(
        "SELECT InvitationID FROM InterviewInvitations WHERE ApplicationID = ?",
        [app.ApplicationID]
      );

      if (existingInvite.length === 0) {
        await execute(`
          INSERT INTO InterviewInvitations (
            ApplicationID, InterviewDate, InterviewType, MeetingLink, InvitationSent, CreatedDate
          ) VALUES (?, DATEADD(day, 3, GETDATE()), 'Video Call', 'https://meet.google.com/rie-agl-interview', 1, GETDATE())
        `, [app.ApplicationID]);
      }

      // Send interview invitation email (uses SMTP if configured, falls back to logging)
      const emailText = 
        `Dear ${app.FullName},\n\n` +
        `Congratulations! Based on our automated CV screening and analysis, we would love to invite you for a Video Interview for the ${app.JobTitle} position.\n\n` +
        `Please use the link below to join your interview:\n` +
        `Meeting Link: https://meet.google.com/rie-agl-interview\n\n` +
        `Best regards,\n` +
        `HR Recruitment Team\n` +
        `RIE-AGL Careers`;

      await sendEmail({
        to: app.Email,
        subject: `Interview Invitation: ${app.FullName} for ${app.JobTitle} at RIE-AGL`,
        text: emailText,
      });
    }

    return NextResponse.json({
      success: true,
      invitedCount: appsToInvite.length,
      message: `Successfully invited ${appsToInvite.length} candidates.`,
    });
  } catch (error) {
    console.error('[POST /api/jobs/:id/bulk-invite]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
