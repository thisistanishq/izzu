import { randomBytes } from "node:crypto";
import { db, webhooks } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId, url, events } = await req.json();

    if (!projectId || !url) {
      return NextResponse.json({ error: "projectId and url are required" }, { status: 400 });
    }

    // Generate webhook secret
    const secret = `whsec_${randomBytes(24).toString("base64url")}`;

    const [webhook] = await db
      .insert(webhooks)
      .values({
        projectId,
        url,
        events: events || ["user.signup", "user.login", "user.updated"],
        secret,
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret, // Only show on creation
        createdAt: webhook.createdAt,
      },
      message: "⚠️ Save this secret! You won't see it again.",
    });
  } catch (error: any) {
    console.error("Create Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
