export const CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL,
  FACE_SERVICE_URL: process.env.FACE_SERVICE_URL || "http://localhost:8000",
  // Default Project ID for fallback/dev (Should be removed in strict production)
  DEFAULT_PROJECT_ID: process.env.DEFAULT_PROJECT_ID || "3f74c8a0-4f42-4f76-93a3-09a3def02a42",

  // Auth Config
  RP_ID: process.env.RP_ID || "localhost",
  ORIGIN: process.env.ORIGIN || "http://localhost:3000",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3001/api/v1",

  // OAuth
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};
