import { randomBytes } from "node:crypto";
import { apiKeys, db, projects, tenants } from "@izzu/db";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, slug } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    // For development: auto-create tenant if none exists
    let tenantId: string;

    const existingTenants = await db.query.tenants.findMany({ limit: 1 });

    if (existingTenants.length > 0) {
      tenantId = existingTenants[0].id;
    } else {
      // Create default tenant for dev
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: "Default Organization",
          slug: "default-org",
          email: "admin@izzu.local",
        })
        .returning();
      tenantId = newTenant.id;
    }

    // Generate secure API Keys
    const publishableKey = `izzu_pk_live_${randomBytes(24).toString("hex")}`;
    const secretKey = `izzu_sk_live_${randomBytes(32).toString("hex")}`;

    // Create project
    const [newProject] = await db
      .insert(projects)
      .values({
        tenantId,
        name,
        slug,
        apiKey: publishableKey,
        config: {
          secretKeyHash: Buffer.from(secretKey).toString("base64"),
          faceIdRequired: true,
          locationRequired: true,
          passwordRequired: true,
          allowedOrigins: [],
        },
      })
      .returning();

    // Store keys in apiKeys table for tracking
    await db.insert(apiKeys).values([
      {
        projectId: newProject.id,
        key: publishableKey,
        type: "publishable",
        name: "Default Publishable Key",
      },
      { projectId: newProject.id, key: secretKey, type: "secret", name: "Default Secret Key" },
    ]);

    return NextResponse.json({
      project: {
        id: newProject.id,
        name: newProject.name,
        slug: newProject.slug,
        apiKey: publishableKey,
        secretKey, // Only returned once on creation!
      },
      message: "Project created successfully. Save your secret key - it won't be shown again!",
    });
  } catch (error: any) {
    console.error("Create Project Error:", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "Project slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
