import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { getPublishedContent, listPublishedContent, prisma } from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/password";
import { authenticateAdmin } from "../src/lib/auth";

async function main() {
  const password = randomUUID();
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);
  assert.notEqual(firstHash, secondHash, "Password hashes must have independent salts");
  assert.equal(await verifyPassword(password, firstHash), true);
  assert.equal(await verifyPassword("incorrect password", firstHash), false);
  assert.equal(await verifyPassword(password, "malformed"), false);

  const email = `test-${randomUUID()}@example.invalid`;
  const key = createHash("sha256").update(email).digest("hex");
  try {
    for (let index = 0; index < 5; index++) {
      const result = await authenticateAdmin(email, password);
      assert.equal(result.error, "The email or password is incorrect.");
    }
    const blocked = await authenticateAdmin(email, password);
    assert.match(blocked.error ?? "", /Too many sign-in attempts/);
    assert.equal((await prisma.loginAttempt.findUnique({ where: { key } }))?.attempts, 5);
  } finally {
    await prisma.loginAttempt.deleteMany({ where: { key } });
  }

  const slug = `cms-test-${randomUUID()}`;
  const content = await prisma.content.create({
    data: {
      slug,
      title: "Temporary persistence test",
      category: "wellness",
      summary: "Temporary test content.",
      body: "This entry is deleted when the persistence test completes.",
      status: "draft",
    },
  });
  try {
    assert.equal(await getPublishedContent(slug), null, "Draft entries must never resolve publicly");
    assert.equal((await listPublishedContent()).some((entry) => entry.slug === slug), false);
    await prisma.content.update({ where: { id: content.id }, data: { status: "published" } });
    assert.equal((await getPublishedContent(slug))?.id, content.id);
    await prisma.content.update({ where: { id: content.id }, data: { status: "draft" } });
    assert.equal(await getPublishedContent(slug), null, "Unpublishing must remove public access immediately");
  } finally {
    await prisma.content.delete({ where: { id: content.id } });
  }
  console.log("Passed: salted password verification, persistent login throttling, database persistence, and draft/public visibility.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
