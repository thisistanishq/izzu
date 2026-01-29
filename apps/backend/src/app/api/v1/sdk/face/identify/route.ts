import { db, endUsers, eq, projects } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";
import { CONFIG } from "@/lib/config";

// SDK Face Identify - 1:N Search for Login
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("project_id") as string;
    const locationLat = formData.get("location_lat") as string;
    const locationLng = formData.get("location_lng") as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: "File and project_id required" }, { status: 400 });
    }

    // Validate API key
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project || project.apiKey !== apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Send to Python Face Service for 1:N Identification
    const faceFormData = new FormData();
    faceFormData.append("file", file);
    faceFormData.append("project_id", projectId);

    const faceRes = await fetch(`${CONFIG.FACE_SERVICE_URL}/identify`, {
      method: "POST",
      body: faceFormData,
    });

    const faceData = await faceRes.json();

    if (!faceRes.ok || !faceData.identified || !faceData.user_id) {
      return NextResponse.json(
        {
          verified: false,
          error: faceData.error || "Face not recognized",
        },
        { status: 200 },
      ); // Return 200 so SDK handles it gracefully
    }

    // Fetch User Details from DB
    const [user] = await db
      .select()
      .from(endUsers)
      .where(eq(endUsers.id, faceData.user_id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ verified: false, error: "User record missing" });
    }

    // Update User Activity
    await db
      .update(endUsers)
      .set({
        lastSignInAt: new Date(),
        lastActiveAt: new Date(),
        lastLoginPhotoUrl: faceData.photo_url || user.lastLoginPhotoUrl,
        locationLat: locationLat || user.locationLat,
        locationLng: locationLng || user.locationLng,
      })
      .where(eq(endUsers.id, user.id));

    return NextResponse.json({
      verified: true,
      confidence: faceData.confidence,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        faceVerified: true,
        location: user.locationLat ? { lat: user.locationLat, lng: user.locationLng } : null,
      },
    });
  } catch (error: any) {
    console.error("SDK Face Identify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
