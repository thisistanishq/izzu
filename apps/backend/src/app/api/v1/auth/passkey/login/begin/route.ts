import { type NextRequest, NextResponse } from "next/server";
import { passkeyService } from "@/lib/auth/passkeys";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json(); // Optional for usernameless flow

    // Create a temporary ID for the challenge if no user known yet
    // For simplicity, client should send a 'sessionKey' or we execute this in context of a partial auth
    // Let's assume client sends a transient ID if anonymous, or we use a cookie.
    // Simplifying: Client sends { userId } if known, or we return a challengeId to track it.

    const options = await passkeyService.generateLoginOptions(userId);

    // We need to associate this challenge with the verification step.
    // Since 'challenge' is random, we can key by challenge itself? No, Redis keys usually need known lookup.
    // Let's simply return the challenge and expect the client to pass it back? No, that's insecure (replay).
    // Correct way: Server stores challenge mapped to a temporary 'authRequestId' passed to client.

    const authRequestId = crypto.randomUUID();
    await redis.set(`authReq:${authRequestId}`, options.challenge, "EX", 300);

    return NextResponse.json({ ...options, authRequestId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
