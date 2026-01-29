import { db, endUsers, projects, sql } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    // Count total end users
    const usersResult = await db.select({ count: sql<number>`count(*)` }).from(endUsers);
    const totalUsers = Number(usersResult[0]?.count || 0);

    // Count users with face encoding (registered faces)
    const faceResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(endUsers)
      .where(sql`${endUsers.faceEncoding} IS NOT NULL`);
    const activeFaceIds = Number(faceResult[0]?.count || 0);

    // Count users with location
    const locationResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(endUsers)
      .where(sql`${endUsers.locationLat} IS NOT NULL`);
    const locationsTracked = Number(locationResult[0]?.count || 0);

    // Count total projects
    const projectsResult = await db.select({ count: sql<number>`count(*)` }).from(projects);
    const totalProjects = Number(projectsResult[0]?.count || 0);

    return NextResponse.json({
      stats: {
        totalUsers,
        activeFaceIds,
        locationsTracked,
        totalProjects,
      },
    });
  } catch (error: any) {
    console.error("Stats Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
