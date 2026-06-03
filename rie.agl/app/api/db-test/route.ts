import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query<{ value: number }>('SELECT 1 AS value');
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('DB connection error:', error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
