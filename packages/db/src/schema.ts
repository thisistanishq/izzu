import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// 1. Platform Layer (Tenants/Developers)
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  email: text("email").notNull(), // Owner email
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    apiKey: text("api_key"), // Publishable API Key
    config: jsonb("config"), // Project config including secretKey hash
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    tenantSlugIdx: uniqueIndex("project_slug_idx").on(t.tenantId, t.slug),
  }),
);

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  key: text("key").notNull().unique(), // In real app, hash this for Secret keys
  type: text("type", { enum: ["publishable", "secret"] }).notNull(),
  name: text("name"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ADMINS - Project creators who use IzzU to secure their apps
export const admins = pgTable(
  "admins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    mobile: text("mobile"),
    locationLat: text("location_lat"),
    locationLng: text("location_lng"),
    avatarUrl: text("avatar_url"),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .default("owner")
      .notNull(),
    emailVerifiedAt: timestamp("email_verified_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    lastLoginAt: timestamp("last_login_at"),
  },
  (t) => ({
    emailIdx: uniqueIndex("admin_email_idx").on(t.email),
    tenantIdx: index("admin_tenant_idx").on(t.tenantId),
  }),
);

// Admin Sessions for JWT-less session management (scalable)
export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id")
      .references(() => admins.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull().unique(), // Secure random token
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("admin_session_token_idx").on(t.token),
    adminIdx: index("admin_session_admin_idx").on(t.adminId),
  }),
);

// 2. Application Layer (End Users)
export const endUsers = pgTable(
  "end_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"), // Admin's display name
    mobile: text("mobile"), // +1234567890
    locationLat: text("location_lat"), // Decimal as text for precision
    locationLng: text("location_lng"),
    faceEncoding: text("face_encoding").array(), // 128-d vector as array of strings/floats
    lastLoginPhotoUrl: text("last_login_photo_url"), // URL to evidence photo
    lastActiveAt: timestamp("last_active_at"), // Session tracking
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    lastSignInAt: timestamp("last_sign_in_at"),
  },
  (t) => ({
    projectEmailIdx: uniqueIndex("end_user_email_idx").on(t.projectId, t.email),
  }),
);

export const identities = pgTable(
  "identities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    endUserId: uuid("end_user_id")
      .references(() => endUsers.id, { onDelete: "cascade" })
      .notNull(),
    provider: text("provider", {
      enum: ["email", "phone", "google", "apple", "microsoft", "github"],
    }).notNull(),
    providerId: text("provider_id").notNull(), // email, phone number, or sub
    passwordHash: text("password_hash"), // For email provider
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    providerIdx: uniqueIndex("provider_idx").on(t.endUserId, t.provider),
    lookupIdx: index("lookup_idx").on(t.provider, t.providerId),
  }),
);

export const passkeys = pgTable("passkeys", {
  id: uuid("id").defaultRandom().primaryKey(),
  endUserId: uuid("end_user_id")
    .references(() => endUsers.id, { onDelete: "cascade" })
    .notNull(),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: text("counter").notNull(), // BigInt as text for safety
  transports: text("transports").array(),
  name: text("name"), // "MacBook Pro TouchID"
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endUserId: uuid("end_user_id")
    .references(() => endUsers.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  projects: many(projects),
  subscriptions: many(subscriptions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [projects.tenantId],
    references: [tenants.id],
  }),
  apiKeys: many(apiKeys),
  endUsers: many(endUsers),
  auditLogs: many(auditLogs), // Relation for new table
  roles: many(roles),
  webhooks: many(webhooks),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  project: one(projects, {
    fields: [apiKeys.projectId],
    references: [projects.id],
  }),
}));

// --- 3. Enterprise Features (New Advanced Detailing) ---

// A. Audit Logs (Security requirement for Enterprise)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  actorId: uuid("actor_id"), // User who performed the action (or API Key ID)
  actorType: text("actor_type", {
    enum: ["user", "api_key", "system"],
  }).notNull(),
  action: text("action").notNull(), // e.g., "login.success", "project.update"
  resource: text("resource").notNull(), // e.g., "identity:123"
  metadata: text("metadata"), // JSON stringified details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// B. RBAC (Role Based Access Control)
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // e.g. "Admin", "Viewer"
  description: text("description"),
  isSystem: boolean("is_system").default(false), // Locked roles
  createdAt: timestamp("created_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleId: uuid("role_id")
    .references(() => roles.id, { onDelete: "cascade" })
    .notNull(),
  action: text("action").notNull(), // "read:users", "write:billing"
  resource: text("resource").default("*"),
  createdAt: timestamp("created_at").defaultNow(),
});

// C. Subscriptions & Billing (SaaS Core)
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status", {
    enum: ["active", "past_due", "canceled", "incomplete"],
  }).notNull(),
  planId: text("plan_id").notNull(), // Stripe Price ID
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  customerId: text("customer_id"), // Stripe Customer ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// D. Webhooks (Event Dispatching)
export const webhooks = pgTable("webhooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(), // HMAC secret
  events: text("events").array(), // ["user.created", "invoice.paid"]
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  project: one(projects, {
    fields: [auditLogs.projectId],
    references: [projects.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  project: one(projects, {
    fields: [roles.projectId],
    references: [projects.id],
  }),
  permissions: many(permissions),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  role: one(roles, {
    fields: [permissions.roleId],
    references: [roles.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [subscriptions.tenantId],
    references: [tenants.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  project: one(projects, {
    fields: [webhooks.projectId],
    references: [projects.id],
  }),
}));

export const endUsersRelations = relations(endUsers, ({ one, many }) => ({
  project: one(projects, {
    fields: [endUsers.projectId],
    references: [projects.id],
  }),
  identities: many(identities),
  passkeys: many(passkeys),
  sessions: many(sessions),
}));

export const identitiesRelations = relations(identities, ({ one }) => ({
  endUser: one(endUsers, {
    fields: [identities.endUserId],
    references: [endUsers.id],
  }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  endUser: one(endUsers, {
    fields: [passkeys.endUserId],
    references: [endUsers.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  endUser: one(endUsers, {
    fields: [sessions.endUserId],
    references: [endUsers.id],
  }),
}));
