import { prisma } from "../src/lib/db";
import { defaultSettings, seedContent } from "../src/lib/seed-content";

async function main() {
  // Settings are the installation marker: deleting all articles through the CMS
  // must not cause starter content to reappear at the next application restart.
  const existing = await prisma.siteSettings.findUnique({ where: { id: "main" } });
  if (existing) {
    console.log("CMS database ready; existing content preserved.");
    return;
  }
  await prisma.$transaction(async (transaction) => {
    await transaction.siteSettings.create({ data: { id: "main", ...defaultSettings } });
    await transaction.content.createMany({ data: seedContent });
  });
  console.log(`CMS initialized with ${seedContent.length} educational articles.`);
}

main().catch((error) => {
  console.error("CMS initialization failed:", error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
