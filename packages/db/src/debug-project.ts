import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { projects } from "./schema";

const run = async () => {
  const client = postgres(process.env.DATABASE_URL || "postgres://tanishq@localhost:5432/izzu");
  const db = drizzle(client);

  const targetId = "b184a8cd-f212-4499-bb96-df4da2c68a51";
  console.log(`Checking for project: ${targetId}`);

  const found = await db.select().from(projects).where(eq(projects.id, targetId));

  console.log("Found:", found);
  await client.end();
};

run();
