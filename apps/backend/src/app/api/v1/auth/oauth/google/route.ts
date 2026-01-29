import { type NextRequest, NextResponse } from "next/server";

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const _GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/v1/auth/oauth/google/callback`
  : "http://localhost:3001/api/v1/auth/oauth/google/callback";

export async function GET(_req: NextRequest) {
  try {
    // Build Google OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    // Add state for CSRF protection
    const state = crypto.randomUUID();
    authUrl.searchParams.set("state", state);

    // In production, store state in session/cookie for verification
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (error: any) {
    console.error("Google OAuth Init Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
