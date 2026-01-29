import { and, db, endUsers, eq, identities, projects } from "@izzu/db";
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";

// SDK User Create - Direct signup without OTP (Face ID is the verification)
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const { email, password, name, project_id, location_lat, location_lng } = await req.json();

    if (!email || !password || !project_id) {
      return NextResponse.json(
        { error: "Email, password, and project_id required" },
        { status: 400 },
      );
    }

    // Validate API key belongs to project
    const [project] = await db.select().from(projects).where(eq(projects.id, project_id)).limit(1);

    if (!project || project.apiKey !== apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(endUsers)
      .where(and(eq(endUsers.projectId, project_id), eq(endUsers.email, cleanEmail)))
      .limit(1);

    if (existingUser) {
      // User exists - return existing user (they can still register face)
      return NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.displayName,
          isExisting: true,
        },
      });
    }

    // Create new user
    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(endUsers)
      .values({
        projectId: project_id,
        email: cleanEmail,
        displayName: name || null,
        locationLat: location_lat?.toString() || null,
        locationLng: location_lng?.toString() || null,
      })
      .returning();

    // Create identity for email/password login
    await db.insert(identities).values({
      endUserId: newUser.id,
      provider: "email",
      providerId: cleanEmail,
      passwordHash,
      verifiedAt: new Date(), // Mark as verified (Face ID is the verification)
    });

    console.log(`[SDK] User created: ${cleanEmail} (Project: ${project.name})`);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.displayName,
      },
    });
  } catch (error: any) {
    console.error("SDK User Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
