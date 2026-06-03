import { SignJWT, jwtVerify } from "jose";
import type { AuthSession } from "../types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "agl-rie-dev-secret-key-min-32-chars-here"
);

const COOKIE_NAME = "agl-auth-token";

// ─── Token ────────────────────────────────────────────────────────────────────

export async function createToken(session: AuthSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<AuthSession> {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as unknown as AuthSession;
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export { COOKIE_NAME };

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
