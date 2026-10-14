import { cookies } from "next/headers";
import prisma from "@/lib/db";
import { generateSecureToken } from "@/lib/security/crypto";

export const SESSION_COOKIE_NAME = "promptvault_session";

// In-memory rate limiting map: ip -> { attempts: number, resetAt: number }
const loginRateLimitMap = new Map<string, { attempts: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    loginRateLimitMap.set(ip, { attempts: 0, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

export function recordFailedLoginAttempt(ip: string): void {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    loginRateLimitMap.set(ip, { attempts: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    record.attempts += 1;
  }
}

export function resetLoginRateLimit(ip: string): void {
  loginRateLimitMap.delete(ip);
}

export interface SessionWithAdmin {
  id: string;
  token: string;
  adminId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  admin: {
    id: string;
    email: string;
    lastLoginAt: Date | null;
  };
}

/**
 * Creates a database-backed session and sets an HttpOnly cookie
 */
export async function createSession(
  adminId: string,
  options?: { userAgent?: string; ipAddress?: string; durationDays?: number }
): Promise<string> {
  const token = generateSecureToken(32);
  const durationDays = options?.durationDays || 30;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token,
      adminId,
      userAgent: options?.userAgent,
      ipAddress: options?.ipAddress,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/**
 * Validates the session from incoming cookies and returns the session & admin
 */
export async function getSession(): Promise<SessionWithAdmin | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!session) return null;

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Refresh lastActiveAt if more than 5 minutes since last active
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (session.lastActiveAt < fiveMinutesAgo) {
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      }).catch(() => {});
    }

    return session;
  } catch (err: any) {
    if (err?.digest === "HANGING_PROMISE_REJECTION" || err?.digest === "DYNAMIC_SERVER_USAGE" || err?.message?.includes("prerender")) {
      throw err;
    }
    console.error("Error retrieving session:", err);
    return null;
  }
}

/**
 * Invalidate current session (logout)
 */
export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await prisma.session.delete({ where: { token } }).catch(() => {});
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (err) {
    console.error("Error destroying session:", err);
  }
}

/**
 * Invalidate all sessions for an admin (logout from all devices)
 */
export async function destroyAllSessions(adminId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { adminId },
  });
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Server guard: requires authentication or throws / redirects
 */
export async function requireAuth(): Promise<SessionWithAdmin> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
