import { NextRequest, NextResponse } from "next/server";
import { db, endUsers, identities, eq, and, auditLogs } from "@izzu/db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/v1/auth/oauth/google/callback`
    : "http://localhost:3001/api/v1/auth/oauth/google/callback";

// Default project ID for demo - in production, get from session/context
const DEFAULT_PROJECT_ID = "3f74c8a0-4f42-4f76-93a3-09a3def02a42";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const storedState = req.cookies.get("oauth_state")?.value;

        // Verify state for CSRF protection
        if (!state || state !== storedState) {
            return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL("/login?error=no_code", req.url));
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            console.error("Token exchange failed:", tokens);
            return NextResponse.redirect(new URL("/login?error=token_exchange_failed", req.url));
        }

        // Get user info from Google
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userInfoResponse.json();

        if (!googleUser.email) {
            return NextResponse.redirect(new URL("/login?error=no_email", req.url));
        }

        // Find or create user
        let userId: string;

        // Check if identity exists
        const existingIdentity = await db.query.identities.findFirst({
            where: (i, { eq, and }) => and(
                eq(i.provider, "google"),
                eq(i.providerId, googleUser.id)
            ),
            with: { endUser: true }
        });

        if (existingIdentity) {
            userId = existingIdentity.endUserId;
            // Update last sign in
            await db.update(endUsers)
                .set({ lastSignInAt: new Date() })
                .where(eq(endUsers.id, userId));
        } else {
            // Check if user with same email exists
            const existingUser = await db.query.endUsers.findFirst({
                where: (u, { eq }) => eq(u.email, googleUser.email)
            });

            if (existingUser) {
                userId = existingUser.id;
                // Link Google identity to existing user
                await db.insert(identities).values({
                    endUserId: userId,
                    provider: "google",
                    providerId: googleUser.id,
                    verifiedAt: new Date(),
                });
            } else {
                // Create new user
                const [newUser] = await db.insert(endUsers).values({
                    projectId: DEFAULT_PROJECT_ID,
                    email: googleUser.email,
                    lastSignInAt: new Date(),
                }).returning();

                userId = newUser.id;

                // Create Google identity
                await db.insert(identities).values({
                    endUserId: userId,
                    provider: "google",
                    providerId: googleUser.id,
                    verifiedAt: new Date(),
                });
            }
        }

        // Create audit log
        try {
            await db.insert(auditLogs).values({
                projectId: DEFAULT_PROJECT_ID,
                action: "user.login",
                actorType: "user",
                actorId: userId,
                resource: `user:${userId}`,
                metadata: JSON.stringify({ provider: "google", email: googleUser.email }),
                ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
                userAgent: req.headers.get("user-agent"),
            });
        } catch (e) {
            console.error("Failed to create audit log:", e);
        }

        // Redirect to dashboard with success
        const dashboardUrl = new URL("/dashboard", req.url);
        dashboardUrl.searchParams.set("login", "success");
        dashboardUrl.searchParams.set("provider", "google");

        const response = NextResponse.redirect(dashboardUrl);
        // Clear OAuth state cookie
        response.cookies.delete("oauth_state");

        return response;

    } catch (error: any) {
        console.error("Google OAuth Callback Error:", error);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url));
    }
}
