import { auditLogs, db, endUsers, eq, identities } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/lib/config";

const GITHUB_CLIENT_ID = CONFIG.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = CONFIG.GITHUB_CLIENT_SECRET || "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = req.cookies.get("oauth_state")?.value;

    if (!state || state !== storedState) {
      return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", req.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error("GitHub token exchange failed:", tokens);
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", req.url));
    }

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const githubUser = await userResponse.json();

    // Get primary email
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const emails = await emailsResponse.json();
    const primaryEmail = emails.find((e: any) => e.primary)?.email || githubUser.email;

    if (!primaryEmail) {
      return NextResponse.redirect(new URL("/login?error=no_email", req.url));
    }

    // Find or create user
    let userId: string;

    const existingIdentity = await db.query.identities.findFirst({
      where: (i, { eq, and }) =>
        and(eq(i.provider, "github"), eq(i.providerId, String(githubUser.id))),
      with: { endUser: true },
    });

    if (existingIdentity) {
      userId = existingIdentity.endUserId;
      await db.update(endUsers).set({ lastSignInAt: new Date() }).where(eq(endUsers.id, userId));
    } else {
      const existingUser = await db.query.endUsers.findFirst({
        where: (u, { eq }) => eq(u.email, primaryEmail),
      });

      if (existingUser) {
        userId = existingUser.id;
        await db.insert(identities).values({
          endUserId: userId,
          provider: "github",
          providerId: String(githubUser.id),
          verifiedAt: new Date(),
        });
      } else {
        const [newUser] = await db
          .insert(endUsers)
          .values({
            projectId: CONFIG.DEFAULT_PROJECT_ID,
            email: primaryEmail,
            lastSignInAt: new Date(),
          })
          .returning();

        userId = newUser.id;

        await db.insert(identities).values({
          endUserId: userId,
          provider: "github",
          providerId: String(githubUser.id),
          verifiedAt: new Date(),
        });
      }
    }

    // Create audit log
    try {
      await db.insert(auditLogs).values({
        projectId: CONFIG.DEFAULT_PROJECT_ID,
        action: "user.login",
        actorType: "user",
        actorId: userId,
        resource: `user:${userId}`,
        metadata: JSON.stringify({
          provider: "github",
          email: primaryEmail,
          username: githubUser.login,
        }),
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      });
    } catch (e) {
      console.error("Failed to create audit log:", e);
    }

    const dashboardUrl = new URL("/dashboard", req.url);
    dashboardUrl.searchParams.set("login", "success");
    dashboardUrl.searchParams.set("provider", "github");

    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.delete("oauth_state");

    return response;
  } catch (error: any) {
    console.error("GitHub OAuth Callback Error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }
}
