import { randomBytes } from "node:crypto";
import { admins, db, eq, tenants } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";
import { createAdminSession, setSessionCookie } from "@/lib/auth/admin-session";
import { otpService } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  try {
    const { identifier, code, name, mobile, locationLat, locationLng } = await req.json();

    if (!identifier || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const verification = await otpService.verifyOtp(identifier, code);

    if (verification.verified) {
      // Check if admin exists
      const [existingAdmin] = await db
        .select()
        .from(admins)
        .where(eq(admins.email, identifier))
        .limit(1);

      let adminId = existingAdmin?.id;
      let tenantId = existingAdmin?.tenantId;

      if (!existingAdmin) {
        // SIGN UP: Create new tenant and admin
        const slug =
          identifier
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-") +
          "-" +
          randomBytes(4).toString("hex");

        const [newTenant] = await db
          .insert(tenants)
          .values({
            name: name || identifier.split("@")[0],
            slug,
            email: identifier,
          })
          .returning();

        tenantId = newTenant.id;

        const [newAdmin] = await db
          .insert(admins)
          .values({
            tenantId: newTenant.id,
            email: identifier,
            displayName: name || null,
            mobile: mobile || null,
            locationLat: locationLat ? String(locationLat) : null,
            locationLng: locationLng ? String(locationLng) : null,
            role: "owner",
            emailVerifiedAt: new Date(),
          })
          .returning();

        adminId = newAdmin.id;
      } else {
        // LOGIN: Update last login
        await db
          .update(admins)
          .set({
            lastLoginAt: new Date(),
            locationLat: locationLat ? String(locationLat) : undefined,
            locationLng: locationLng ? String(locationLng) : undefined,
          })
          .where(eq(admins.id, existingAdmin.id));
      }

      // Create session
      const ipAddress =
        req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";
      const sessionToken = await createAdminSession(adminId!, ipAddress, userAgent);

      // Set cookie
      await setSessionCookie(sessionToken);

      return NextResponse.json({
        success: true,
        adminId,
        tenantId,
        isNewAdmin: !existingAdmin,
      });
    }

    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin OTP Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
