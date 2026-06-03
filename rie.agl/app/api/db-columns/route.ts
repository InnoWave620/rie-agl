import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const columns = await query<{ TABLE_NAME: string; COLUMN_NAME: string; DATA_TYPE: string }>(
      `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME IN ('Jobs','Applicants','Applications','ATS_Scores','InterviewInvitations','AI_Evaluations','Users')
       ORDER BY TABLE_NAME, ORDINAL_POSITION`
    );
    return NextResponse.json({ ok: true, columns });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
