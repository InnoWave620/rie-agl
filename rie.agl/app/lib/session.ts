import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from './auth';
import type { AuthSession } from '../types';

/**
 * Reads the JWT from the request cookie and returns the session.
 * Returns null if the cookie is missing or invalid.
 * Use in Server Components and Server Actions only.
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}
