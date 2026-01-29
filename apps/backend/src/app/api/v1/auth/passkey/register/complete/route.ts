import { type NextRequest, NextResponse } from "next/server";
import { passkeyService } from "@/lib/auth/passkeys";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { userId, body } = await req.json();

    const expectedChallenge = await redis.get(`challenge:${userId}`);
    if (!expectedChallenge) {
      return NextResponse.json({ error: "Challenge expired or invalid" }, { status: 400 });
    }

    const result = await passkeyService.verifyRegister(userId, body, expectedChallenge);

    // Clean up challenge
    await redis.del(`challenge:${userId}`);

    if (result.verified) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
