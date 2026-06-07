import { NextRequest, NextResponse } from 'next/server';
import { query, esc } from '../../lib/db';
import { verifyToken, COOKIE_NAME, createToken, cookieOptions } from '../../lib/auth';
import bcrypt from 'bcryptjs';
import type { AuthSession } from '../../types';

interface DBUser {
  UserID: number;
  FullName: string;
  Email: string;
  RoleName: string;
  CreatedDate?: Date | string;
  AvatarUrl?: string | null;
}

// GET /api/users — List HR platform users from the Users table
export async function GET() {
  try {
    const rows = await query<DBUser>(`
      SELECT UserID, FullName, Email, RoleName, CreatedDate, AvatarUrl
      FROM Users
      ORDER BY UserID ASC
    `);

    const data = rows.map(r => {
      const raw = r.FullName ?? r.Email?.split('@')[0] ?? 'User';
      const parts = raw.replace(/[._]/, ' ').split(' ');
      const firstName = parts[0] ?? raw;
      const lastName  = parts.slice(1).join(' ') || '';
      const initials  = (firstName[0] ?? '') + (lastName[0] ?? firstName[1] ?? '');

      return {
        id:             String(r.UserID),
        firstName,
        lastName,
        email:          r.Email ?? '',
        role:           (r.RoleName ?? 'recruiter').toLowerCase().replace(/\s+/g, '_'),
        division:       undefined as string | undefined,
        avatarInitials: initials.toUpperCase(),
        avatarUrl:      r.AvatarUrl ?? undefined,
        createdAt:      r.CreatedDate ? new Date(r.CreatedDate).toISOString() : '',
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// PUT /api/users — Update the current user's profile information
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    let session;
    try {
      session = await verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const { firstName, lastName, email, role, avatarUrl, password } = await req.json();

    if (!firstName || !email) {
      return NextResponse.json({ success: false, error: 'First name and email are required' }, { status: 400 });
    }

    const fullName = `${firstName.trim()} ${lastName?.trim() || ''}`.trim();
    const dbRole = role === 'admin' ? 'Admin' : role === 'hr_manager' ? 'HR Manager' : 'Recruiter';

    let queryStr = `
      UPDATE Users
      SET FullName = ${esc(fullName)},
          Email = ${esc(email.trim().toLowerCase())},
          RoleName = ${esc(dbRole)},
          AvatarUrl = ${avatarUrl ? esc(avatarUrl) : 'NULL'}
    `;

    if (password && password.trim().length > 0) {
      if (password.length < 8) {
        return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      queryStr += `, PasswordHash = ${esc(hashedPassword)}`;
    }

    queryStr += ` WHERE UserID = ${Number(session.userId)}`;

    await query(queryStr);

    // Re-generate a session token with the updated details
    const nameParts = fullName.trim().split(/\s+/);
    const updatedInitials = nameParts.map(p => p[0]?.toUpperCase() ?? '').slice(0, 2).join('');
    const newSession: AuthSession = {
      userId:         session.userId,
      email:          email.trim().toLowerCase(),
      firstName:      firstName.trim(),
      lastName:       lastName?.trim() || '',
      role:           role,
      avatarInitials: updatedInitials || 'U',
      avatarUrl:      avatarUrl || undefined,
    };

    const newToken = await createToken(newSession);
    const response = NextResponse.json({ success: true, data: { user: newSession } });
    response.cookies.set(COOKIE_NAME, newToken, cookieOptions(60 * 60 * 8)); // 8 hours
    return response;
  } catch (error) {
    console.error('[PUT /api/users]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
