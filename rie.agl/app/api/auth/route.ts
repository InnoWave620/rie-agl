import { NextRequest, NextResponse } from 'next/server';
import { createToken, cookieOptions, COOKIE_NAME, verifyToken } from '../../lib/auth';
import { execute } from '../../lib/db';
import bcrypt from 'bcryptjs';
import type { AuthSession } from '../../types';

interface DBUser {
  UserID: number;
  FullName: string;
  Email: string;
  RoleName: string;
  Department: string | null;
  IsActive: boolean | number;
  PasswordHash: string | null;
  AvatarUrl?: string | null;
}

function mapRole(roleName: string): AuthSession['role'] {
  const r = (roleName ?? '').toLowerCase();
  if (r.includes('admin'))     return 'admin';
  if (r.includes('hr'))        return 'hr_manager';
  if (r.includes('recruiter')) return 'recruiter';
  return 'recruiter';
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts.map(p => p[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

// ── POST /api/auth — Login ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch user from DB
    const rows = await execute<DBUser>(`
      SELECT UserID, FullName, Email, RoleName, Department, IsActive, PasswordHash, AvatarUrl
      FROM Users
      WHERE Email = ?
    `, [email.trim().toLowerCase()]);

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Check active
    if (!user.IsActive) {
      return NextResponse.json(
        { success: false, error: 'Your account has been deactivated. Contact your administrator.' },
        { status: 403 }
      );
    }

    // Check password
    if (!user.PasswordHash) {
      return NextResponse.json(
        { success: false, error: 'Account not set up yet — contact your administrator.' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const nameParts = user.FullName.trim().split(/\s+/);
    const session: AuthSession = {
      userId:         String(user.UserID),
      email:          user.Email,
      firstName:      nameParts[0] ?? '',
      lastName:       nameParts.slice(1).join(' ') ?? '',
      role:           mapRole(user.RoleName),
      avatarInitials: initials(user.FullName),
      avatarUrl:      user.AvatarUrl ?? undefined,
    };

    const token = await createToken(session);

    const response = NextResponse.json({
      success: true,
      data: { user: session },
      message: 'Login successful',
    });

    response.cookies.set(COOKIE_NAME, token, cookieOptions(60 * 60 * 8)); // 8 hours
    return response;
  } catch (error) {
    console.error('[POST /api/auth]', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE /api/auth — Logout ─────────────────────────────────────────────────
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}

// ── GET /api/auth — Current session ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const session = await verifyToken(token);
    return NextResponse.json({ success: true, data: { user: session } });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
  }
}
