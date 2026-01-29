import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://izzu:password@localhost:5432/izzu";
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export * from "drizzle-orm";
export * from "./schema";

import type {
  adminSessions,
  admins,
  endUsers,
  identities,
  passkeys,
  projects,
  tenants,
} from "./schema";

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type EndUser = typeof endUsers.$inferSelect;
export type NewEndUser = typeof endUsers.$inferInsert;

export type Identity = typeof identities.$inferSelect;
export type NewIdentity = typeof identities.$inferInsert;

export type Passkey = typeof passkeys.$inferSelect;
export type NewPasskey = typeof passkeys.$inferInsert;

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;
