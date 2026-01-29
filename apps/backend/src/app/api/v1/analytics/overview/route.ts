import { db, endUsers } from "@izzu/db";
import { gte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    // In a real app, verify authentication here via session/token
    // const projectId = req.headers.get("x-project-id");

    // 1. Total Users
    const [userCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(endUsers);

    // 2. Active Users (Last 24h)
    const ONE_DAY_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [activeCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(endUsers)
      .where(gte(endUsers.lastSignInAt, ONE_DAY_AGO));

    // 3. Recent Activity (Audit Logs)
    const recentActivity = await db.query.auditLogs.findMany({
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit: 5,
      with: {
        project: true,
        // actor: true // If we had an actor relation
      },
    });

    // 4. Daily Signups (Last 7 Days) - Simplified for Postgres
    const signups = await db.execute(sql`
            SELECT 
                DATE(created_at) as date, 
                COUNT(*) as count 
            FROM ${endUsers} 
            WHERE created_at > NOW() - INTERVAL '7 days' 
            GROUP BY DATE(created_at) 
            ORDER BY DATE(created_at) ASC
        `);

    return NextResponse.json({
      totalUsers: userCount.count,
      activeUsers: activeCount.count,
      recentActivity,
      signups, // Array of { date, count }
    });
  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
