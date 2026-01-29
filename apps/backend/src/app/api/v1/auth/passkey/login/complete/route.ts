import { type NextRequest, NextResponse } from "next/server";
import { passkeyService } from "@/lib/auth/passkeys";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { body, authRequestId } = await req.json();

    if (!authRequestId) {
      return NextResponse.json({ error: "Missing authRequestId" }, { status: 400 });
    }

    const expectedChallenge = await redis.get(`authReq:${authRequestId}`);
    if (!expectedChallenge) {
      return NextResponse.json({ error: "Challenge expired or invalid" }, { status: 400 });
    }

    const result = await passkeyService.verifyLogin(body, expectedChallenge);

    // Clean up
    await redis.del(`authReq:${authRequestId}`);

    if (result.verified) {
      // Issue Session Token here (JWT or DB session)
      // For now, just return success + userId
      return NextResponse.json({ success: true, userId: result.userId });
    } else {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
