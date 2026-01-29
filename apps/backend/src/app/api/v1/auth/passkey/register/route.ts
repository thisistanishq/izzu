import { NextRequest, NextResponse } from "next/server";
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { db, passkeys, endUsers, eq } from "@izzu/db";

const RP_NAME = "IzzU Auth";
const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";

// Generate registration options for a new passkey
export async function POST(req: NextRequest) {
    try {
        const { userId, email } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: "userId and email are required" }, { status: 400 });
        }

        // Get existing passkeys for this user
        const existingPasskeys = await db.query.passkeys.findMany({
            where: (p, { eq }) => eq(p.endUserId, userId)
        });

        const excludeCredentials = existingPasskeys.map(pk => ({
            id: pk.credentialId,
            type: "public-key" as const,
            transports: pk.transports as AuthenticatorTransport[] || [],
        }));

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userID: Buffer.from(userId),
            userName: email,
            userDisplayName: email.split("@")[0],
            attestationType: "none",
            excludeCredentials,
            authenticatorSelection: {
                residentKey: "preferred",
                userVerification: "preferred",
                authenticatorAttachment: "platform", // Prefer platform authenticators (TouchID, FaceID)
            },
        });

        // Store challenge temporarily (in production, use Redis/session)
        // For now, return in response and client must send back
        return NextResponse.json({
            options,
            challenge: options.challenge, // Client must return this
        });

    } catch (error: any) {
        console.error("Passkey Registration Options Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
