import { type NextRequest, NextResponse } from "next/server";

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const response = await fetch(`${FACE_SERVICE_URL}/liveness-check`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Liveness Proxy Error:", error);
    return NextResponse.json({ error: "Liveness check failed" }, { status: 500 });
  }
}
