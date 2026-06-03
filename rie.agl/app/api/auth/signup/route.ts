import { NextRequest, NextResponse } from 'next/server';
import { createToken, cookieOptions, COOKIE_NAME } from '../../../lib/auth';
import { query, esc } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import type { AuthSession } from '../../../types';

// ── POST /api/auth/signup — Register a new user ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password, role, department } = await req.json();

    // Validate required fields
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
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Map role name
    const roleName = role === 'admin'      ? 'Admin' :
                     role === 'hr_manager' ? 'HR Manager' : 'Recruiter';
    const dept = (department ?? 'Human Resources').trim();

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
      return NextResponse.json({ success: false, error: 'Failed to create account' }, { status: 500 });
    }

    // Build session and auto-login
    const nameParts = fullName.trim().split(/\s+/);
    const session: AuthSession = {
      userId:         String(newUserId),
      email:          emailLower,
      firstName:      nameParts[0] ?? '',
      lastName:       nameParts.slice(1).join(' ') ?? '',
      role:           (role as AuthSession['role']) ?? 'recruiter',
      avatarInitials: nameParts.map((p: string) => p[0]?.toUpperCase() ?? '').slice(0, 2).join(''),
    };

    const token = await createToken(session);

    const response = NextResponse.json({
      success: true,
      data: { user: session },
      message: 'Account created successfully',
    }, { status: 201 });

    response.cookies.set(COOKIE_NAME, token, cookieOptions(60 * 60 * 8)); // 8 hours
    return response;
  } catch (error) {
    console.error('[POST /api/auth/signup]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
