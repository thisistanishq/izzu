import { type NextRequest, NextResponse } from "next/server";
import { oauthService } from "@/lib/auth/oauth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // projectId

    if (!code || !state) {
      return NextResponse.json({ error: "Invalid callback parameters" }, { status: 400 });
    }

    const result = await oauthService.handleCallback(provider, code, state);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
