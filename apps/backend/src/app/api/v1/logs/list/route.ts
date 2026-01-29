import { NextRequest, NextResponse } from "next/server";
import { db, auditLogs } from "@izzu/db";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const logs = await db.query.auditLogs.findMany({
            orderBy: (logs, { desc }) => [desc(logs.createdAt)],
            limit: 50,
            with: {
                project: true,
            }
        });

        const formattedLogs = logs.map(log => ({
            id: log.id,
            action: log.action,
            actorType: log.actorType,
            actorId: log.actorId,
            targetType: log.resource.split(":")[0] || "unknown",
            targetId: log.resource.split(":")[1] || log.resource,
            metadata: log.metadata,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
            projectName: log.project?.name || "System",
        }));

        return NextResponse.json({ logs: formattedLogs });

    } catch (error: any) {
        console.error("Fetch Audit Logs Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
