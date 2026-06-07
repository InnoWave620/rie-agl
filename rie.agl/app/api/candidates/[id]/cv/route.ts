import { NextRequest, NextResponse } from 'next/server';
import { execute } from '../../../../lib/db';
import { getPresignedCVUrl } from '../../../../lib/s3';

interface Params { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const applicantId = parseInt(id);

  if (isNaN(applicantId)) {
    return NextResponse.json({ success: false, error: 'Invalid candidate ID' }, { status: 400 });
  }

  try {
    interface ResumeRow {
      CVUrl: string;
      FileName: string | null;
    }

    const rows = await execute<ResumeRow>(
      'SELECT CVUrl, FileName FROM Resumes WHERE ApplicantID = ?',
      [applicantId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'CV not found for this candidate' }, { status: 404 });
    }

    const { CVUrl, FileName } = rows[0];

    // Extract the key from the stored URL
    let key = CVUrl;
    try {
      const url = new URL(CVUrl);
      // pathname starts with a slash, e.g. "/resumes/12345_cv.pdf"
      // we strip the leading slash to get the R2 key
      key = url.pathname.substring(1);
    } catch {
      // If CVUrl is not a valid URL (e.g. it is already just the key), use it directly
    }

    // Generate pre-signed URL (expires in 15 minutes / 900 seconds)
    // Passes original filename to download as the correct friendly file name
    const presignedUrl = await getPresignedCVUrl(key, FileName ?? undefined, 900);

    // Redirect the recruiter directly to the secure pre-signed Cloudflare R2 URL
    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    console.error('[GET /api/candidates/:id/cv]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
