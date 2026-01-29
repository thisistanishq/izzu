import { db, endUsers, identities } from "@izzu/db";

// Mock configuration - in real app, these come from Tenant/Project settings in DB
const PROVIDERS: Record<
  string,
  { clientId: string; clientSecret: string; authUrl: string; tokenUrl: string; scope: string }
> = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "mock_google_id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock_google_secret",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "mock_github_id",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "mock_github_secret",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "user:email",
  },
  // Add Apple/Microsoft similarly
};

export class OAuthService {
  /**
   * Get Authorization URL
   */
  getAuthUrl(provider: string, projectId: string) {
    const config = PROVIDERS[provider];
    if (!config) throw new Error(`Provider ${provider} not supported`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: `http://localhost:3000/api/v1/auth/oauth/${provider}/callback`,
      response_type: "code",
      scope: config.scope,
      state: projectId, // Passing projectId in state for now
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange Code for Token (Mock Implementation)
   */
  async handleCallback(provider: string, _code: string, projectId: string) {
    // 1. Exchange code for access_token (Mocked)
    // const tokenResponse = await fetch(config.tokenUrl, ...);
    // const userInfo = await fetch(userInfoUrl, ...);

    // Mock user info based on code "mock_code"
    const userInfo = {
      id: "12345_mock_id",
      email: "mock_user@example.com",
    };

    // 2. Find or Create User/Identity
    const identity = await db.query.identities.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.provider, provider as any), eq(t.providerId, userInfo.id)),
    });

    let userId = identity?.endUserId;

    if (!identity) {
      // Create new user
      const [newUser] = await db
        .insert(endUsers)
        .values({
          projectId: projectId, // Retrieved from state
          email: userInfo.email,
        })
        .returning();

      userId = newUser.id;

      await db.insert(identities).values({
        endUserId: userId,
        provider: provider as any,
        providerId: userInfo.id,
        verifiedAt: new Date(),
      });
    }

    return { success: true, userId };
  }
}

export const oauthService = new OAuthService();
