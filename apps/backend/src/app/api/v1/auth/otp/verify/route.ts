import { db, endUsers, eq, identities } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";
import { otpService } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  try {
    const { identifier, code, projectId, name, mobile, locationLat, locationLng } =
      await req.json();

    if (!identifier || !code || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const verification = await otpService.verifyOtp(identifier, code);

    if (verification.verified) {
      // Logic: Find or create user
      const [existingIdentity] = await db
        .select()
        .from(identities)
        .where(eq(identities.providerId, identifier)) // Ideally also filter by provider type
        .limit(1);

      let userId = existingIdentity?.endUserId;

      if (!existingIdentity) {
        // Create new user (Sign Up) with MANDATORY surveillance data
        const [newUser] = await db
          .insert(endUsers)
          .values({
            projectId: projectId,
            email: identifier,
            displayName: name || null,
            mobile: mobile || null,
            locationLat: locationLat ? String(locationLat) : null,
            locationLng: locationLng ? String(locationLng) : null,
            lastSignInAt: new Date(),
          })
          .returning();

        userId = newUser.id;

        await db.insert(identities).values({
          endUserId: userId,
          provider: identifier.includes("@") ? "email" : "phone",
          providerId: identifier,
          verifiedAt: new Date(),
        });
      } else {
        // Update existing user with latest location
        if (userId && (locationLat || locationLng)) {
          await db
            .update(endUsers)
            .set({
              locationLat: locationLat ? String(locationLat) : undefined,
              locationLng: locationLng ? String(locationLng) : undefined,
              lastSignInAt: new Date(),
            })
            .where(eq(endUsers.id, userId));
        }
      }

      return NextResponse.json({ success: true, userId });
    }

    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
