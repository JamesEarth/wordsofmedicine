import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export type { Content, SiteSettings } from "../generated/prisma/client";

const configuredUrl = process.env.DATABASE_URL;
if (!configuredUrl || !/^postgres(?:ql)?:\/\//.test(configuredUrl)) {
  throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
}
const globalDatabase = globalThis as unknown as {
  postgresPrisma?: { connectionString: string; client: PrismaClient };
};
const cachedDatabase = globalDatabase.postgresPrisma;

// A development reload must not reuse a client for a previous database/schema.
export const prisma =
  cachedDatabase?.connectionString === configuredUrl
    ? cachedDatabase.client
    : new PrismaClient({
        adapter: new PrismaPg(
          { connectionString: configuredUrl },
          { schema: new URL(configuredUrl).searchParams.get("schema") ?? "public" },
        ),
      });

if (process.env.NODE_ENV !== "production") {
  globalDatabase.postgresPrisma = { connectionString: configuredUrl, client: prisma };
}

export async function listPublishedContent() {
  return prisma.content.findMany({
    where: { status: "published" },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    select: { id: true, slug: true, title: true, summary: true, category: true, readTime: true, requiresLogin: true },
  });
}

export async function getPublishedContent(slug: string) {
  // This helper is safe for public callers. Member reads authorize separately.
  return prisma.content.findFirst({ where: { slug, status: "published", requiresLogin: false } });
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
