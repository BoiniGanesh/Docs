import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { UnauthorizedError } from "./errors";

/**
 * Mocked auth: the user picks a seeded account; we store their id in an
 * HMAC-signed, httpOnly cookie. No passwords — intentionally out of scope.
 */

export const SESSION_COOKIE = "ajaia_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    console.warn("SESSION_SECRET is not set; using an insecure default.");
  }
  return s || "dev-only-insecure-secret";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function encodeSession(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function decodeSession(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = token.slice(0, idx);
  const expected = Buffer.from(sign(userId));
  const actual = Buffer.from(token.slice(idx + 1));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return userId;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const userId = decodeSession(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT id, email, name FROM users WHERE id = ?", args: [userId] });
  const row = res.rows[0];
  return row ? { id: String(row.id), email: String(row.email), name: String(row.name) } : null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
