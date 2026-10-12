import { prisma } from "../src/lib/db";

prisma.$connect()
  .then(() => console.log("PostgreSQL connection ready."))
  .catch(() => {
    console.error("Could not connect to PostgreSQL. Check DATABASE_URL and that the database is running.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
