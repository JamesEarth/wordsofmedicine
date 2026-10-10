import "dotenv/config";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";

const configuredUrl = process.env.CMS_DATABASE_URL ?? "file:./prisma/cms.db";
if (!configuredUrl.startsWith("file:")) throw new Error("CMS_DATABASE_URL must be a SQLite file: URL.");
const databasePath = resolve(configuredUrl.slice(5));
mkdirSync(dirname(databasePath), { recursive: true });
// Append mode creates a missing file and never truncates existing content.
closeSync(openSync(databasePath, "a", 0o600));
