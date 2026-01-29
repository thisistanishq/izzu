import { type NextRequest, NextResponse } from "next/server";

// GitHub OAuth Configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const _GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/v1/auth/oauth/github/callback`
  : "http://localhost:3001/api/v1/auth/oauth/github/callback";

export async function GET(_req: NextRequest) {
  try {
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("scope", "read:user user:email");

    const state = crypto.randomUUID();
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error: any) {
    console.error("GitHub OAuth Init Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
