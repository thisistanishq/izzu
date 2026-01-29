import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { db, passkeys, endUsers, eq, auditLogs } from "@izzu/db";

const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";
const DEFAULT_PROJECT_ID = "3f74c8a0-4f42-4f76-93a3-09a3def02a42";

export async function POST(req: NextRequest) {
    try {
        const { userId, credential, challenge } = await req.json();

        if (!userId || !credential || !challenge) {
            return NextResponse.json({
                error: "userId, credential, and challenge are required"
            }, { status: 400 });
        }

        // Find the passkey
        const passkey = await db.query.passkeys.findFirst({
            where: (p, { eq }) => eq(p.credentialId, credential.id)
        });

        if (!passkey) {
            return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
        }

        // Verify the authentication response
        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: challenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: passkey.credentialId,
                publicKey: Buffer.from(passkey.publicKey, "base64url"),
                counter: Number(passkey.counter),
                transports: passkey.transports as AuthenticatorTransport[] || [],
            },
        });

        if (!verification.verified) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 400 });
        }

        // Update counter for replay attack protection
        await db.update(passkeys)
            .set({
                counter: String(verification.authenticationInfo.newCounter),
                lastUsedAt: new Date(),
            })
            .where(eq(passkeys.id, passkey.id));

        // Update user's last sign in
        await db.update(endUsers)
            .set({ lastSignInAt: new Date() })
            .where(eq(endUsers.id, userId));

        // Create audit log
        try {
            await db.insert(auditLogs).values({
                projectId: DEFAULT_PROJECT_ID,
                action: "user.login",
                actorType: "user",
                actorId: userId,
                resource: `user:${userId}`,
                metadata: JSON.stringify({ provider: "passkey", passkeyName: passkey.name }),
                ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
                userAgent: req.headers.get("user-agent"),
            });
        } catch (e) {
            console.error("Failed to create audit log:", e);
        }

        return NextResponse.json({
            success: true,
            userId,
            message: "Authentication successful"
        });

    } catch (error: any) {
        console.error("Passkey Auth Verify Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
