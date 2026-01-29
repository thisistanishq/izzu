import { db } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const webhooksList = await db.query.webhooks.findMany({
      with: { project: true },
      orderBy: (w, { desc }) => [desc(w.createdAt)],
      limit: 20,
    });

    const formatted = webhooksList.map((w) => ({
      id: w.id,
      url: w.url,
      events: w.events,
      isActive: w.isActive,
      secret: w.secret ? `whsec_...${w.secret.slice(-4)}` : null,
      // lastTriggeredAt: w.lastTriggeredAt,
      createdAt: w.createdAt,
      projectName: w.project?.name || "Unknown",
    }));

    return NextResponse.json({ webhooks: formatted });
  } catch (error: any) {
    console.error("Fetch Webhooks Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
