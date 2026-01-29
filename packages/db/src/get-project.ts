import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { projects, tenants } from "./schema";

const run = async () => {
  const client = postgres(
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/izzu",
  );
  const db = drizzle(client);

  console.log("🔍 Checking for Projects...");
  const allProjects = await db.select().from(projects);

  if (allProjects.length > 0) {
    console.log(`✅ Found Project: ${allProjects[0].id} (${allProjects[0].name})`);
  } else {
    console.log("⚠️ No projects found. Creating Default Tenant & Project...");

    // Create Tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: "Default Organization",
        slug: "default-org",
        email: "admin@localhost", // Required field
      })
      .returning();

    // Create Project
    const [project] = await db
      .insert(projects)
      .values({
        tenantId: tenant.id,
        name: "Default Project",
        slug: "default-project",
      })
      .returning();

    console.log(`✅ Created Project: ${project.id}`);
  }

  await client.end();
};

run();
