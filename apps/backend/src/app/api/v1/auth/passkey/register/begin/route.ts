import { type NextRequest, NextResponse } from "next/server";
import { passkeyService } from "@/lib/auth/passkeys";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json(); // In real app, get from session/JWT

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    const options = await passkeyService.generateRegisterOptions(userId, email);

    // Store challenge in Redis (expire in 5 mins)
    await redis.set(`challenge:${userId}`, options.challenge, "EX", 300);

    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
