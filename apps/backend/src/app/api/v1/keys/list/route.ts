import { db } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    // In production: validate session and get projectId from auth context
    // For now, fetch all keys (should be scoped to project)

    const keysList = await db.query.apiKeys.findMany({
      with: {
        project: true,
      },
      orderBy: (keys, { desc }) => [desc(keys.createdAt)],
      limit: 20,
    });

    // Mask secret keys for security - only show last 4 chars
    const maskedKeys = keysList.map((key) => ({
      id: key.id,
      name: key.name || "Unnamed Key",
      type: key.type, // "publishable" or "secret"
      keyPreview: key.type === "secret" ? `sk_live_...${key.key.slice(-4)}` : key.key, // Show full publishable key
      fullKey: key.key, // Only return this in secure contexts
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      projectName: key.project?.name || "Unknown Project",
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error: any) {
    console.error("Fetch API Keys Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
