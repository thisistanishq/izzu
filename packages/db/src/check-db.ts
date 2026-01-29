import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const run = async () => {
  console.log("🔍 Checking Database Connection...");

  // 1. Check Env
  const connectionString =
    process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/izzu";
  console.log(`📡 Target: ${connectionString.replace(/:[^:@]*@/, ":****@")}`); // Hide password

  try {
    // 2. Connect
    const client = postgres(connectionString, { max: 1 });
    const _db = drizzle(client, { schema });

    // 3. Query
    const _result = await client`SELECT 1 as connected`;
    console.log("✅ Database Connection SUCCESSFUL!");
    console.log("   Server Version:", await client`SHOW server_version`);

    await client.end();
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Database Connection FAILED");
    console.error(`   Error: ${err.message}`);
    console.error("\n💡 FIX: Please make sure you have PostgreSQL running locally.");
    console.error(
      "   Should be listening on port 5432 with user 'postgres' and password 'postgres'.",
    );
    console.error("   OR update .env.local with your actual connection string.");
    process.exit(1);
  }
};

run();
