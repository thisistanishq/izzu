import { randomBytes } from "node:crypto";
import { apiKeys, db } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";

function generateApiKey(type: "publishable" | "secret"): string {
  const prefix = type === "publishable" ? "pk_live_" : "sk_live_";
  const randomPart = randomBytes(24).toString("base64url");
  return prefix + randomPart;
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, name, type } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!type || !["publishable", "secret"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'publishable' or 'secret'" },
        { status: 400 },
      );
    }

    const newKey = generateApiKey(type);

    const [createdKey] = await db
      .insert(apiKeys)
      .values({
        projectId,
        key: newKey,
        type,
        name: name || `${type === "secret" ? "Secret" : "Publishable"} Key`,
      })
      .returning();

    return NextResponse.json({
      success: true,
      key: {
        id: createdKey.id,
        key: newKey, // Show full key ONLY on creation
        type: createdKey.type,
        name: createdKey.name,
        createdAt: createdKey.createdAt,
      },
      message: "⚠️ Copy this key now. You won't be able to see the full secret key again.",
    });
  } catch (error: any) {
    console.error("Create API Key Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
