import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Forward to Python Service
    const pyRes = await fetch("http://localhost:8000/register", {
      method: "POST",
      body: formData,
    });

    const data = await pyRes.json();

    if (!pyRes.ok) {
      return NextResponse.json(data, { status: pyRes.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Face Register Proxy Error:", error);
    return NextResponse.json({ error: "Face Service Unavailable" }, { status: 503 });
  }
}
