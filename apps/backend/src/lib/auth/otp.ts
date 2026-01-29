import twilio from "twilio";
import { redis } from "@/lib/redis";

// ==============================================
// OTP Service - Twilio Verify Integration
// ==============================================
//
// Twilio Verify handles OTP via SMS, Email, or WhatsApp
//
// Setup:
// 1. Create account at twilio.com
// 2. Create a Verify Service: Console > Verify > Services > Create
// 3. Copy the Service SID (starts with VA...)
// 4. Get Account SID and Auth Token from Console Dashboard
// 5. Add to .env.local:
//    TWILIO_ACCOUNT_SID="AC..."
//    TWILIO_AUTH_TOKEN="..."
//    TWILIO_VERIFY_SID="VA..."
// ==============================================

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID;
const DEV_MODE = process.env.OTP_DEV_MODE === "true" || !TWILIO_ACCOUNT_SID;

// Initialize Twilio client if credentials exist
const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

export class OtpService {
  /**
   * Send OTP to email or phone
   * @param identifier - Email or phone number (E.164 format for phone: +1234567890)
   * @param channel - "email" or "sms"
   */
  async sendOtp(
    identifier: string,
    channel: "email" | "sms" = "email",
  ): Promise<{ success: boolean; otp?: string }> {
    const cleanIdentifier =
      channel === "email" ? identifier.toLowerCase().trim() : identifier.replace(/\s/g, "");

    // DEV MODE: Generate local OTP and return it
    if (DEV_MODE) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await redis.set(`otp:${cleanIdentifier}`, otp, "EX", 300);
      console.log(`[OTP DEV] Generated for ${cleanIdentifier}: ${otp}`);
      return { success: true, otp };
    }

    // PRODUCTION: Use Twilio Verify
    if (!twilioClient || !TWILIO_VERIFY_SID) {
      throw new Error(
        "Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID",
      );
    }

    try {
      const verification = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SID)
        .verifications.create({
          to: cleanIdentifier,
          channel: channel, // "sms" or "email"
        });

      console.log(
        `[TWILIO] OTP sent to ${cleanIdentifier} via ${channel} (Status: ${verification.status})`,
      );
      return { success: true };
    } catch (error: any) {
      console.error(`[TWILIO] Error sending OTP:`, error.message);
      throw error;
    }
  }

  /**
   * Verify OTP code
   * @param identifier - Email or phone used when sending
   * @param code - The OTP code to verify
   */
  async verifyOtp(identifier: string, code: string): Promise<{ verified: boolean }> {
    const cleanIdentifier = identifier.toLowerCase().trim();
    const cleanCode = code.trim();

    // DEV MODE: Check Redis
    if (DEV_MODE) {
      const storedOtp = await redis.get(`otp:${cleanIdentifier}`);
      console.log(`[OTP DEV] Verifying - Input: ${cleanCode}, Stored: ${storedOtp}`);

      if (storedOtp && storedOtp === cleanCode) {
        await redis.del(`otp:${cleanIdentifier}`);
        return { verified: true };
      }
      return { verified: false };
    }

    // PRODUCTION: Use Twilio Verify
    if (!twilioClient || !TWILIO_VERIFY_SID) {
      throw new Error("Twilio not configured");
    }

    try {
      const check = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SID)
        .verificationChecks.create({
          to: cleanIdentifier,
          code: cleanCode,
        });

      console.log(`[TWILIO] Verification check: ${check.status}`);
      return { verified: check.status === "approved" };
    } catch (error: any) {
      console.error(`[TWILIO] Verification error:`, error.message);
      return { verified: false };
    }
  }
}

export const otpService = new OtpService();
