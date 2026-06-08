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

// POST /api/users — Create/Invite a new user (admin/hr_manager action)
export async function POST(req: NextRequest) {
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

    if (session.role !== 'admin' && session.role !== 'hr_manager') {
      return NextResponse.json({ success: false, error: 'Not authorized to invite team members' }, { status: 403 });
    }

    const { fullName, email, password, role, division } = await req.json();

    if (!fullName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const emailLower = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await query<{ UserID: number }>(`
      SELECT UserID FROM Users WHERE Email = ${esc(emailLower)}
    `);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A team member with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Map role name
    const roleName = role === 'admin'      ? 'Admin' :
                     role === 'hr_manager' ? 'HR Manager' : 'Recruiter';
    const dept = (division ?? 'Human Resources').trim();

    // Insert user
    const rows = await query<{ UserID: number }>(`
      INSERT INTO Users (FullName, Email, RoleName, Department, PasswordHash, IsActive, CreatedDate)
      OUTPUT INSERTED.UserID
      VALUES (
        ${esc(fullName.trim())},
        ${esc(emailLower)},
        ${esc(roleName)},
        ${esc(dept)},
        ${esc(passwordHash)},
        1,
        GETDATE()
      )
    `);

    const newUserId = rows[0]?.UserID;
    if (!newUserId) {
      return NextResponse.json({ success: false, error: 'Failed to create team member' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Team member invited successfully',
      data: {
        id: String(newUserId),
        fullName: fullName.trim(),
        email: emailLower,
        role,
        division
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/users]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

