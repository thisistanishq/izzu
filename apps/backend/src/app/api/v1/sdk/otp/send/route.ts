import { db, eq, projects } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";
import { otpService } from "@/lib/auth/otp";

// SDK OTP Send - for end-users in admin's projects
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const { email, project_id } = await req.json();

    if (!email || !project_id) {
      return NextResponse.json({ error: "Email and project_id required" }, { status: 400 });
    }

    // Validate API key belongs to project
    const [project] = await db.select().from(projects).where(eq(projects.id, project_id)).limit(1);

    if (!project || project.apiKey !== apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Send OTP - returns { success, otp? } where otp is present in dev mode
    const result = await otpService.sendOtp(email, "email");

    // In dev mode, OTP is returned so SDK can display it
    if (result.otp) {
      return NextResponse.json({
        success: true,
        message: "OTP generated (Dev Mode)",
        otp: result.otp,
        devMode: true,
      });
    }

    return NextResponse.json({ success: true, message: "OTP sent to email" });
  } catch (error: any) {
    console.error("SDK OTP Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
