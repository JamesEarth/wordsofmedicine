import "dotenv/config";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// The CMS has its own SQLite store. The existing PostgreSQL DATABASE_URL and
// migration history are intentionally kept separate.
const configuredUrl = process.env.CMS_DATABASE_URL ?? "file:./prisma/cms.db";
if (!configuredUrl.startsWith("file:")) {
  throw new Error("CMS_DATABASE_URL must be a SQLite file: URL.");
}

export default defineConfig({
  schema: "prisma/cms/schema.prisma",
  migrations: { path: "prisma/cms/migrations" },
  datasource: { url: `file:${resolve(configuredUrl.slice(5))}` },
});
