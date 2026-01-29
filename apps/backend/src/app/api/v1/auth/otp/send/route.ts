import { type NextRequest, NextResponse } from "next/server";
import { otpService } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  try {
    const { identifier, type } = await req.json(); // identifier = email or phone number

    if (!identifier || !["email", "phone"].includes(type)) {
      return NextResponse.json({ error: "Invalid identifier or type" }, { status: 400 });
    }

    await otpService.sendOtp(identifier, type);

    return NextResponse.json({ success: true, message: `OTP sent to ${type}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
