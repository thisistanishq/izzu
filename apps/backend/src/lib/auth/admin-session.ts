import { adminSessions, admins, db } from "@izzu/db";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export interface AdminSession {
  adminId: string;
  email: string;
  displayName: string | null;
  tenantId: string;
}

const SESSION_COOKIE_NAME = "izzu_admin_session";

export async function getAdminSession(_req?: NextRequest): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    // Find valid session
    const [session] = await db
      .select()
      .from(adminSessions)
      .where(and(eq(adminSessions.token, sessionToken), gt(adminSessions.expiresAt, new Date())))
      .limit(1);

    if (!session) {
      return null;
    }

    // Get admin details
    const [admin] = await db.select().from(admins).where(eq(admins.id, session.adminId)).limit(1);

    if (!admin) {
      return null;
    }

    return {
      adminId: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      tenantId: admin.tenantId,
    };
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

export async function requireAdminSession(req?: NextRequest): Promise<AdminSession> {
  const session = await getAdminSession(req);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function generateSessionToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createAdminSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(adminSessions).values({
    adminId,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
