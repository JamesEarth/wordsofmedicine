import "dotenv/config";
import { resolve } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

export type { Content, SiteSettings } from "../generated/prisma/client";

const configuredUrl = process.env.CMS_DATABASE_URL ?? "file:./prisma/cms.db";
if (!configuredUrl.startsWith("file:")) {
  throw new Error("CMS_DATABASE_URL must be a SQLite file: URL.");
}
const globalDatabase = globalThis as unknown as { cmsPrisma?: PrismaClient };

export const prisma =
  globalDatabase.cmsPrisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: `file:${resolve(configuredUrl.slice(5))}`,
    }),
  });

if (process.env.NODE_ENV !== "production") globalDatabase.cmsPrisma = prisma;

export async function listPublishedContent() {
  return prisma.content.findMany({
    where: { status: "published" },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
  });
}

export async function getPublishedContent(slug: string) {
  return prisma.content.findFirst({ where: { slug, status: "published" } });
}

export async function getSettings() {
  return prisma.siteSettings.findUniqueOrThrow({ where: { id: "main" } });
}

export async function listAdminContent() {
  return prisma.content.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function getAdminContent(id: string) {
  return prisma.content.findUnique({ where: { id } });
}
