import { db } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    // Fetch all projects (dev mode - no tenant filtering)
    const projectsList = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
      limit: 50,
    });

    const formattedProjects = projectsList.map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      apiKeyPrefix: project.apiKey ? `${project.apiKey.substring(0, 25)}...` : "N/A",
      createdAt: project.createdAt,
    }));

    return NextResponse.json({
      projects: formattedProjects,
    });
  } catch (error: any) {
    console.error("Fetch Projects Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
