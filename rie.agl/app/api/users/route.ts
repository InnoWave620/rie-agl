import { NextResponse } from 'next/server';
import { query } from '../../lib/db';

interface DBUser {
  UserID: number;
  Username: string;
  Email: string;
  Role: string;
  CreatedDate?: Date | string;
}

// GET /api/users — List HR platform users from the Users table
export async function GET() {
  try {
    const rows = await query<DBUser>(`
      SELECT UserID, Username, Email, Role, CreatedDate
      FROM Users
      ORDER BY UserID ASC
    `);

    const data = rows.map(r => {
      // Split username into first/last (e.g. "Jane.Doe" or "JaneDoe")
      const raw = r.Username ?? r.Email?.split('@')[0] ?? 'User';
      const parts = raw.replace(/[._]/, ' ').split(' ');
      const firstName = parts[0] ?? raw;
      const lastName  = parts.slice(1).join(' ') || '';
      const initials  = (firstName[0] ?? '') + (lastName[0] ?? firstName[1] ?? '');

      return {
        id:             String(r.UserID),
        firstName,
        lastName,
        email:          r.Email ?? '',
        role:           (r.Role ?? 'recruiter').toLowerCase().replace(/\s+/g, '_'),
        division:       undefined as string | undefined,
        avatarInitials: initials.toUpperCase(),
        createdAt:      r.CreatedDate ? new Date(r.CreatedDate).toISOString() : '',
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
