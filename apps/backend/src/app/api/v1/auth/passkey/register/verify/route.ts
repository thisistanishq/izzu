import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { db, passkeys } from "@izzu/db";

const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";

export async function POST(req: NextRequest) {
    try {
        const { userId, credential, challenge, name } = await req.json();

        if (!userId || !credential || !challenge) {
            return NextResponse.json({
                error: "userId, credential, and challenge are required"
            }, { status: 400 });
        }

        // Verify the registration response
        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: challenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
        });

        if (!verification.verified || !verification.registrationInfo) {
            return NextResponse.json({ error: "Verification failed" }, { status: 400 });
        }

        const { credential: verifiedCredential } = verification.registrationInfo;

        // Store the passkey
        const [newPasskey] = await db.insert(passkeys).values({
            endUserId: userId,
            credentialId: verifiedCredential.id,
            publicKey: Buffer.from(verifiedCredential.publicKey).toString("base64url"),
            counter: String(verifiedCredential.counter),
            transports: verifiedCredential.transports || [],
            name: name || "Passkey",
        }).returning();

        return NextResponse.json({
            success: true,
            passkeyId: newPasskey.id,
            message: "Passkey registered successfully"
        });

    } catch (error: any) {
        console.error("Passkey Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
