import { and, db, endUsers, eq, identities, projects } from "@izzu/db";
import * as bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { otpService } from "@/lib/auth/otp";

// SDK OTP Verify - Creates or authenticates end-user
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const { email, code, password, project_id, location_lat, location_lng, name } =
      await req.json(); // Cleaned

    if (!email || !code || !project_id) {
      return NextResponse.json({ error: "Email, code, and project_id required" }, { status: 400 });
    }

    // Validate API key
    const [project] = await db.select().from(projects).where(eq(projects.id, project_id)).limit(1);

    if (!project || project.apiKey !== apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Verify OTP
    const verification = await otpService.verifyOtp(email, code);
    if (!verification.verified) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(endUsers)
      .where(and(eq(endUsers.projectId, project_id), eq(endUsers.email, email)))
      .limit(1);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // LOGIN: Update last sign in and location, and name if provided
      userId = existingUser.id;
      await db
        .update(endUsers)
        .set({
          displayName: name || existingUser.displayName,
          lastSignInAt: new Date(),
          lastActiveAt: new Date(),
          locationLat: location_lat ? String(location_lat) : existingUser.locationLat,
          locationLng: location_lng ? String(location_lng) : existingUser.locationLng,
        })
        .where(eq(endUsers.id, existingUser.id));
    } else {
      // SIGNUP: Create new user
      isNewUser = true;

      // Hash password if provided
      let passwordHash: string | undefined;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      const [newUser] = await db
        .insert(endUsers)
        .values({
          projectId: project_id,
          email,
          displayName: name,
          locationLat: location_lat ? String(location_lat) : null,
          locationLng: location_lng ? String(location_lng) : null,
          lastSignInAt: new Date(),
          lastActiveAt: new Date(),
        })
        .returning();

      userId = newUser.id;

      // Create identity with password
      await db.insert(identities).values({
        endUserId: userId,
        provider: "email",
        providerId: email,
        passwordHash,
        verifiedAt: new Date(),
      });
    }

    // Get user data for response
    const [user] = await db.select().from(endUsers).where(eq(endUsers.id, userId)).limit(1);

    return NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        faceVerified: !!user.faceEncoding,
        location: user.locationLat ? { lat: user.locationLat, lng: user.locationLng } : null,
      },
    });
  } catch (error: any) {
    console.error("SDK OTP Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
