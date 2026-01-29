import { db, endUsers, eq, type NewPasskey, passkeys } from "@izzu/db";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

const RP_NAME = "IzzU Auth";
const RP_ID = "localhost"; // TODO: Make dynamic based on Tenant/Project domain
const ORIGIN = "http://localhost:3000"; // TODO: Make dynamic

export class PasskeyService {
  /**
   * 1. Start Registration (Get Options)
   */
  async generateRegisterOptions(userId: string, userEmail: string) {
    // Get existing passkeys to prevent re-registration
    const userPasskeys = await db.select().from(passkeys).where(eq(passkeys.endUserId, userId));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new Uint8Array(Buffer.from(userId)), // Convert string UUID to Buffer/Uint8Array
      userName: userEmail,
      attestationType: "none", // Simplest for now
      excludeCredentials: userPasskeys.map((key) => ({
        id: key.credentialId,
        transports: key.transports as any, // Cast to internal type
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform", // FaceID/TouchID usually 'platform'
      },
    });

    return options; // Frontend sends this to navigator.credentials.create()
  }

  /**
   * 2. Verify Registration (Save Key)
   */
  async verifyRegister(userId: string, body: any, expectedChallenge: string) {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
      const info = verification.registrationInfo as any;
      // Handle valid v12 structure differences if needed, or rely on any
      const credentialID = info.credentialID || info.credential?.id;
      const credentialPublicKey = info.credentialPublicKey || info.credential?.publicKey;
      const counter = info.counter || info.credential?.counter;
      const _credentialDeviceType = info.credentialDeviceType || info.credential?.transports;
      const _credentialBackedUp = info.credentialBackedUp || false;

      const newPasskey: NewPasskey = {
        endUserId: userId,
        credentialId: credentialID,
        publicKey: Buffer.from(credentialPublicKey).toString("base64"), // Store as Base64 string
        counter: counter.toString(),
        transports: body.response.transports || [],
        name: "Passkey", // We can let user name it later
      };

      await db.insert(passkeys).values(newPasskey);
      return { verified: true };
    }

    return { verified: false };
  }

  /**
   * 3. Start Login (Get Options)
   */
  async generateLoginOptions(userId?: string) {
    // If userId provided, we can filter `allowCredentials`.
    // For "Passkey First" (Usernameless), we leave allowCredentials empty.

    let allowCredentials;
    if (userId) {
      const userPasskeys = await db.select().from(passkeys).where(eq(passkeys.endUserId, userId));

      allowCredentials = userPasskeys.map((key) => ({
        id: key.credentialId,
        transports: key.transports as any,
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: "preferred",
    });

    return options;
  }

  /**
   * 4. Verify Login
   */
  async verifyLogin(body: any, expectedChallenge: string) {
    // Look up passkey by credential ID
    const credentialId = body.id;
    const [passkey] = await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.credentialId, credentialId))
      .limit(1);

    if (!passkey) {
      throw new Error("Passkey not found");
    }

    // We need the user from this passkey
    const _user = await db.query.endUsers.findFirst({
      where: eq(endUsers.id, passkey.endUserId),
    });

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: passkey.credentialId,
        credentialPublicKey: Buffer.from(passkey.publicKey, "base64"),
        counter: parseInt(passkey.counter, 10),
        transports: passkey.transports as any,
      },
    } as any);

    if (verification.verified) {
      // Update counter
      await db
        .update(passkeys)
        .set({
          counter: verification.authenticationInfo.newCounter.toString(),
          lastUsedAt: new Date(),
        })
        .where(eq(passkeys.id, passkey.id));

      return { verified: true, userId: passkey.endUserId };
    }

    return { verified: false };
  }
}

export const passkeyService = new PasskeyService();
