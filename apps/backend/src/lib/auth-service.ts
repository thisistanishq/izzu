import { apiKeys, db, eq } from "@izzu/db";

export type AuthResult =
  | { valid: true; projectId: string; type: "publishable" | "secret" }
  | { valid: false; error: string };

export async function validateApiKey(key: string): Promise<AuthResult> {
  const [apiKey] = await db
    .select({
      projectId: apiKeys.projectId,
      type: apiKeys.type,
    })
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);

  if (!apiKey) {
    return { valid: false, error: "Invalid API Key" };
  }

  return {
    valid: true,
    projectId: apiKey.projectId,
    type: apiKey.type as "publishable" | "secret",
  };
}
