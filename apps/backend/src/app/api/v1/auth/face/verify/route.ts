import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Forward to Python Service
    // Note: Python service expects 'user_id' and 'file'
    const pyRes = await fetch("http://localhost:8000/verify", {
      method: "POST",
      body: formData,
    });

    const data = await pyRes.json();

    if (!pyRes.ok) {
      return NextResponse.json(data, { status: pyRes.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Face Verify Proxy Error:", error);
    return NextResponse.json({ error: "Face Service Unavailable" }, { status: 503 });
  }
}
