import { NextRequest, NextResponse } from 'next/server';
import { execute } from '../../../../lib/db';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const applicantId = parseInt(id);
  if (isNaN(applicantId)) {
    return NextResponse.json({ success: false, error: 'Invalid candidate ID' }, { status: 400 });
  }

  try {
    const { applicationId, notes } = await req.json();
    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 });
    }

    // Update the Applications table
    await execute(
      `UPDATE Applications SET Notes = ? WHERE ApplicationID = ? AND ApplicantID = ?`,
      [notes || null, parseInt(applicationId), applicantId]
    );

    return NextResponse.json({ success: true, message: 'Notes saved successfully' });
  } catch (error) {
    console.error('[POST /api/candidates/:id/notes]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
