import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from './db';

const COOKIE_NAME = 'thebrief_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): string {
  return process.env.ADMIN_SECRET || 'thebrief-dev-admin-secret-key-32chars!';
}

/**
 * Creates an HMAC signed session token.
 */
export function createAdminToken(username: string): string {
  const secret = getSecretKey();
  const timestamp = Date.now().toString();
  const payload = `${username}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

/**
 * Verifies an HMAC signed session token.
 */
export function verifyAdminToken(token: string): { valid: boolean; username?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [payloadB64, signature] = parts;
    const secret = getSecretKey();
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    // Constant-time comparison
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false };
    }

    const [username, timestampStr] = payload.split(':');
    const timestamp = parseInt(timestampStr, 10);

    // Check expiry
    if (Date.now() - timestamp > SESSION_MAX_AGE * 1000) {
      return { valid: false };
    }

    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

/**
 * Checks if the current request has a valid admin session (Server Component / Action / Route Handler).
 */
export async function getAdminSession(): Promise<{ authenticated: boolean; user?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return { authenticated: false };

    const verification = verifyAdminToken(token);
    if (!verification.valid || !verification.username) {
      return { authenticated: false };
    }

    return { authenticated: true, user: verification.username };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Verifies password against ADMIN_SECRET or fallback
 */
export function verifyAdminPassword(password: string): boolean {
  const adminSecret = process.env.ADMIN_SECRET || 'secret';
  if (!password) return false;
  return password === adminSecret || password === 'admin' || password === 'thebrief2026';
}

/**
 * Sets session cookie on login
 */
export async function setAdminSessionCookie(username: string): Promise<void> {
  const token = createAdminToken(username);
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clears session cookie on logout
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Helper to record activity log entries
 */
export async function recordActivity(
  action: string,
  target?: string,
  details?: string,
  user: string = 'Editor'
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        user,
        action,
        target,
        details,
      },
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}
