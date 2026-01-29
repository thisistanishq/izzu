import { type NextRequest, NextResponse } from "next/server";
import { oauthService } from "@/lib/auth/oauth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const projectId = searchParams.get("projectId") || searchParams.get("state");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    if (!code) {
      // Step 1: Redirect to Auth URL
      const url = oauthService.getAuthUrl(provider, projectId);
      return NextResponse.redirect(url);
    } else {
      // Fallback if needed
      const url = oauthService.getAuthUrl(provider, projectId);
      return NextResponse.redirect(url);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
