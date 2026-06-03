import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../lib/db';

export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get('table') ?? 'Jobs';
  // Only allow alphanumeric table names to prevent injection
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
    return NextResponse.json({ ok: false, error: 'Invalid table name' }, { status: 400 });
  }
  try {
    const cols = await query<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
      COLUMN_DEFAULT: string | null;
    }>(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);
    return NextResponse.json({ ok: true, columns: cols });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
