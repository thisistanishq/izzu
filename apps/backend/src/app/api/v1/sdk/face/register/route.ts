import { and, db, endUsers, eq, projects } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/lib/config";

// SDK Face Register - Stores face encoding for end-user
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const email = formData.get("email") as string;
    const projectId = formData.get("project_id") as string;
    const locationLat = formData.get("location_lat") as string;
    const locationLng = formData.get("location_lng") as string;

    if (!file || !email || !projectId) {
      return NextResponse.json({ error: "File, email, and project_id required" }, { status: 400 });
    }

    // Validate API key
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project || project.apiKey !== apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Find user
    const [user] = await db
      .select()
      .from(endUsers)
      .where(and(eq(endUsers.projectId, projectId), eq(endUsers.email, email)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Send to Python Face Service for encoding
    const faceFormData = new FormData();
    faceFormData.append("file", file);
    faceFormData.append("user_id", user.id);

    const faceRes = await fetch(`${CONFIG.FACE_SERVICE_URL}/register`, {
      method: "POST",
      body: faceFormData,
    });

    const faceData = await faceRes.json();

    if (!faceRes.ok || !faceData.success) {
      return NextResponse.json(
        { error: faceData.error || "Face registration failed" },
        { status: 400 },
      );
    }

    // Store face encoding and photo URL
    await db
      .update(endUsers)
      .set({
        faceEncoding: faceData.encoding ? [JSON.stringify(faceData.encoding)] : null,
        lastLoginPhotoUrl: faceData.photo_url || null,
        locationLat: locationLat || user.locationLat,
        locationLng: locationLng || user.locationLng,
        lastActiveAt: new Date(),
      })
      .where(eq(endUsers.id, user.id));

    return NextResponse.json({
      registered: true,
      photoUrl: faceData.photo_url,
      user: {
        id: user.id,
        email: user.email,
        faceVerified: true,
      },
    });
  } catch (error: any) {
    console.error("SDK Face Register Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
