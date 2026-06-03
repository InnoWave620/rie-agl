import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const tables = await query<{ TABLE_NAME: string; TABLE_TYPE: string }>(
      `SELECT TABLE_NAME, TABLE_TYPE 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`
    );
    return NextResponse.json({ ok: true, tables });
  } catch (error) {
    console.error('DB error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
