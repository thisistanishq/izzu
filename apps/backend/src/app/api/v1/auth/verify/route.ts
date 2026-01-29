import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  const key = authHeader.split(" ")[1];
  const result = await validateApiKey(key);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    message: "Authenticated",
    projectId: result.projectId,
    type: result.type,
  });
}
