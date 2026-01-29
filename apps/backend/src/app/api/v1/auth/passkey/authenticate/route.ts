import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { db, passkeys } from "@izzu/db";

const RP_ID = process.env.RP_ID || "localhost";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        // Find user by email and get their passkeys
        const user = await db.query.endUsers.findFirst({
            where: (u, { eq }) => eq(u.email, email)
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userPasskeys = await db.query.passkeys.findMany({
            where: (p, { eq }) => eq(p.endUserId, user.id)
        });

        if (userPasskeys.length === 0) {
            return NextResponse.json({ error: "No passkeys registered" }, { status: 404 });
        }

        const allowCredentials = userPasskeys.map(pk => ({
            id: pk.credentialId,
            type: "public-key" as const,
            transports: pk.transports as AuthenticatorTransport[] || [],
        }));

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            allowCredentials,
            userVerification: "preferred",
        });

        return NextResponse.json({
            options,
            userId: user.id,
            challenge: options.challenge,
        });

    } catch (error: any) {
        console.error("Passkey Auth Options Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
