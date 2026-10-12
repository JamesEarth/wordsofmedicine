import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { Client } from "pg";
import { chromium, expect as baseExpect, type Page, type Request } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const expect = baseExpect.configure({ timeout: 15000 });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

async function main() {
  const sourceUrl = process.env.DATABASE_URL;
  if (!sourceUrl) throw new Error("DATABASE_URL is required.");
  const schema = `wom_membership_test_${randomUUID().replaceAll("-", "")}`;
  const testUrl = new URL(sourceUrl);
  testUrl.searchParams.set("schema", schema);
  const control = new Client({ connectionString: sourceUrl });
  await control.connect();
  await control.query(`CREATE SCHEMA "${schema}"`);
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: testUrl.toString() }, { schema }) });
  let server: ChildProcess | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let serverOutput = "";

  try {
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--config", "prisma.config.ts"], {
      env: { ...process.env, DATABASE_URL: testUrl.toString() }, stdio: "pipe",
    });
    execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/test-cms.ts"], {
      env: { ...process.env, DATABASE_URL: testUrl.toString() }, stdio: "pipe",
    });
    console.log("Passed existing CMS checks in an isolated database schema.");
    const password = `Test-${randomUUID()}`;
    const passwordHash = await hashPassword(password);
    await db.admin.create({ data: { email: "admin@example.invalid", passwordHash } });
    const baseArticle = { category: "wellness", summary: "A public preview.", status: "published", sourceName: "Reference", sourceUrl: "https://example.com/reference" };
    const publicArticle = await db.content.create({ data: { ...baseArticle, slug: "public-test", title: "Public test article", body: "Public article body.", imageUrl: "/images/hero-care.jpg", tag: "Keep this tag", featured: true } });
    const privateBody = `PRIVATE_BODY_${randomUUID()}`;
    const privateArticle = await db.content.create({ data: { ...baseArticle, slug: "member-test", title: "Member test article", body: privateBody, requiresLogin: true } });
    await db.content.create({ data: { ...baseArticle, slug: "draft-test", title: "Draft test article", body: "Draft secret", status: "draft" } });

    const portFinder = createServer();
    portFinder.listen(0, "127.0.0.1");
    await once(portFinder, "listening");
    const address = portFinder.address();
    assert(address && typeof address !== "string");
    const port = address.port;
    await new Promise<void>((resolve) => portFinder.close(() => resolve()));
    const baseUrl = `http://localhost:${port}`;
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port), "--hostname", "127.0.0.1"], {
      env: { ...process.env, DATABASE_URL: testUrl.toString(), NODE_ENV: "production" }, stdio: ["ignore", "pipe", "pipe"],
    });
    server.stdout?.on("data", (chunk) => { serverOutput += chunk.toString(); });
    server.stderr?.on("data", (chunk) => { serverOutput += chunk.toString(); });
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(`Test server exited: ${serverOutput}`);
      try { if ((await fetch(baseUrl)).ok) break; } catch {}
      if (attempt === 99) throw new Error("Test server did not start.");
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true, args: ["--no-sandbox"] });
    const adminContext = await browser.newContext();
    const memberContext = await browser.newContext();
    const otherContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const admin = await adminContext.newPage();
    const member = await memberContext.newPage();
    const other = await otherContext.newPage();
    const guest = await guestContext.newPage();
    const pageErrors: string[] = [];
    for (const page of [admin, member, other, guest]) page.on("pageerror", (error) => pageErrors.push(error.message));

    async function submit(page: Page, button: string) {
      const sent = page.waitForRequest((request) => request.method() === "POST" && Boolean(request.headers()["next-action"]));
      await page.getByRole("button", { name: button, exact: true }).click();
      return sent;
    }
    async function replay(request: Request, context = guestContext, oldId?: string, newId?: string) {
      const data = request.postData() ?? "";
      return context.request.post(request.url(), { headers: {
        "next-action": request.headers()["next-action"],
        "content-type": request.headers()["content-type"],
        origin: baseUrl,
      }, data: oldId && newId ? data.replaceAll(oldId, newId) : data });
    }
    async function register(page: Page, username: string, code: string) {
      await page.goto(`${baseUrl}/login`);
      const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Create account", exact: true }) });
      await form.getByLabel("Username", { exact: true }).fill(username);
      await form.getByLabel("Email", { exact: true }).fill(`${username}@example.invalid`);
      await form.getByLabel("Password", { exact: true }).fill(password);
      await form.getByLabel("Invitation code", { exact: true }).fill(code);
      await submit(page, "Create account");
      return form;
    }
    async function login(page: Page, username: string) {
      await page.goto(`${baseUrl}/login?next=%2Fblog%2Fmember-test`);
      const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Sign in", exact: true }) });
      await form.getByLabel("Email", { exact: true }).fill(`${username}@example.invalid`);
      await form.getByLabel("Password", { exact: true }).fill(password);
      await submit(page, "Sign in");
      await expect(page).toHaveURL(`${baseUrl}/blog/member-test`);
      await expect(page.getByText(privateBody, { exact: true })).toBeVisible();
    }

    // Public HTML and RSC payloads must never include a restricted body.
    assert(!(await (await guest.request.get(baseUrl)).text()).includes(privateBody));
    await guest.goto(`${baseUrl}/blog/member-test`);
    await expect(guest.getByRole("link", { name: "Sign in or register" })).toBeVisible();
    assert(!(await (await guest.request.get(`${baseUrl}/blog/member-test`)).text()).includes(privateBody));
    await guest.goto(`${baseUrl}/blog/public-test`);
    await expect(guest.getByRole("button", { name: /Share article|Like|Post comment/ })).toHaveCount(0);
    await guest.goto(`${baseUrl}/blog/draft-test`);
    await expect(guest.getByText("Draft secret", { exact: true })).toHaveCount(0);
    await guest.goto(`${baseUrl}/admin/content/${publicArticle.id}/edit`);
    await expect(guest).toHaveURL(`${baseUrl}/admin/login`);

    await admin.goto(`${baseUrl}/admin/login`);
    await admin.getByLabel("Email", { exact: true }).fill("admin@example.invalid");
    await admin.getByLabel("Password", { exact: true }).fill(password);
    await submit(admin, "Log in");
    await expect(admin).toHaveURL(`${baseUrl}/admin`);
    await admin.goto(`${baseUrl}/admin/content/${publicArticle.id}/edit`);
    await admin.getByLabel("Article title", { exact: true }).fill("Edited public article");
    await submit(admin, "Save changes");
    await expect(admin).toHaveURL(/\/admin\?success=saved$/);
    const edited = await db.content.findUniqueOrThrow({ where: { id: publicArticle.id } });
    assert.equal(edited.title, "Edited public article");
    assert.equal(edited.imageUrl, "/images/hero-care.jpg");
    assert.equal(edited.tag, "Keep this tag");
    assert.equal(edited.sourceUrl, baseArticle.sourceUrl);
    assert.equal(edited.featured, true);

    await admin.goto(`${baseUrl}/admin/members`);
    const createInvites = admin.getByRole("region", { name: "Create invitations", exact: true });
    await createInvites.getByLabel("Registrations allowed per code", { exact: true }).fill("2");
    await submit(admin, "Generate invitations");
    await expect(createInvites.getByRole("status")).toContainText("Copy these codes now:");
    const sharedCode = (await createInvites.getByRole("status").innerText()).match(/[a-f0-9]{32}/)?.[0];
    assert(sharedCode);
    await expect((await register(member, "reader", sharedCode)).getByRole("status")).toContainText("Account created");
    await expect((await register(other, "reader", sharedCode)).getByRole("alert")).toContainText("already in use");
    assert.equal((await db.invite.findUniqueOrThrow({ where: { codeHash: digest(sharedCode) } })).usedCount, 1, "Failed signup must roll back invitation use");
    await expect((await register(other, "other", sharedCode)).getByRole("status")).toContainText("Account created");
    await expect((await register(guest, "exhausted", sharedCode)).getByRole("alert")).toContainText("fully used");

    // Two simultaneous registrations must not oversubscribe the last use.
    const raceCode = randomUUID().replaceAll("-", "");
    await db.invite.create({ data: { codeHash: digest(raceCode) } });
    const racePage = await guestContext.newPage();
    const racingForms = await Promise.all([register(guest, "race_one", raceCode), register(racePage, "race_two", raceCode)]);
    await Promise.all(racingForms.map((form) => expect(form.locator('[role="alert"], [role="status"]')).toHaveCount(1)));
    await expect.poll(async () => db.user.count({ where: { username: { in: ["race_one", "race_two"] } } })).toBe(1);
    await expect.poll(async () => (await db.invite.findUniqueOrThrow({ where: { codeHash: digest(raceCode) } })).usedCount).toBe(1);
    await racePage.close();

    await createInvites.getByLabel("Number of codes", { exact: true }).fill("100");
    await createInvites.getByLabel("Registrations allowed per code", { exact: true }).fill("1");
    await submit(admin, "Generate invitations");
    await expect.poll(async () => (await createInvites.getByRole("status").innerText()).match(/[a-f0-9]{32}/g)?.length).toBe(100);
    assert.equal(await db.invite.count(), 102);
    const sharedInvite = await db.invite.findUniqueOrThrow({ where: { codeHash: digest(sharedCode) } });
    const inviteDetails = admin.locator("details").filter({ has: admin.locator(`input[name="id"][value="${sharedInvite.id}"]`) });
    await inviteDetails.locator("summary").click();
    await inviteDetails.getByLabel("Total registration limit", { exact: true }).fill("3");
    await inviteDetails.getByLabel("Replacement code", { exact: true }).fill("replacement-code-12345");
    await inviteDetails.getByLabel("Active", { exact: true }).uncheck();
    await inviteDetails.getByRole("button", { name: "Update invitation", exact: true }).click();
    await expect(inviteDetails.getByRole("status")).toContainText("New code:");
    await expect((await register(guest, "disabled_invite", "replacement-code-12345")).getByRole("alert")).toContainText("disabled");
    assert.equal((await db.invite.findUniqueOrThrow({ where: { id: sharedInvite.id } })).usedCount, 2);
    await inviteDetails.getByLabel("Active", { exact: true }).check();
    await inviteDetails.getByRole("button", { name: "Update invitation", exact: true }).click();
    await expect.poll(async () => (await db.invite.findUniqueOrThrow({ where: { id: sharedInvite.id } })).isActive).toBe(true);
    await expect((await register(guest, "replacement_user", "replacement-code-12345")).getByRole("status")).toContainText("Account created");
    console.log("Passed: guest access, admin editing, invite registration, rollback, quota concurrency, and batches of 100.");

    await login(member, "reader");
    await login(other, "other");
    const reader = await db.user.findUniqueOrThrow({ where: { username: "reader" } });
    const otherUser = await db.user.findUniqueOrThrow({ where: { username: "other" } });
    const likeRequest = await submit(member, "Like (0)");
    await expect(member.getByRole("button", { name: "Unlike (1)", exact: true })).toBeVisible();
    await replay(likeRequest, memberContext);
    await replay(likeRequest);
    assert.equal(await db.like.count({ where: { contentId: privateArticle.id } }), 1);
    await member.getByLabel("Your comment", { exact: true }).fill("A useful explanation.");
    await submit(member, "Post comment");
    await expect(member.getByText("A useful explanation.", { exact: true })).toBeVisible();

    await admin.reload();
    const permissionForm = admin.locator("form").filter({ has: admin.locator(`input[name="userId"][value="${reader.id}"]`) });
    await permissionForm.getByLabel("Allow commenting", { exact: true }).uncheck();
    const permissionRequest = admin.waitForRequest((request) => request.method() === "POST" && Boolean(request.headers()["next-action"]));
    await permissionForm.getByRole("button", { name: "Save permission", exact: true }).click();
    await expect(permissionForm.getByRole("status")).toContainText("saved");
    const forgedPermission = await permissionRequest;
    await member.getByLabel("Your comment", { exact: true }).fill("Must be blocked.");
    await submit(member, "Post comment");
    await expect(member.getByRole("alert")).toContainText("disabled for your account");
    assert.equal(await db.comment.count({ where: { body: "Must be blocked." } }), 0);
    await replay(forgedPermission, memberContext, reader.id, otherUser.id);
    assert.equal((await db.user.findUniqueOrThrow({ where: { id: otherUser.id } })).canComment, true, "Members cannot change admin permissions");

    await admin.goto(`${baseUrl}/admin/content/${privateArticle.id}/edit`);
    await admin.getByLabel("Allow new comments", { exact: true }).uncheck();
    await submit(admin, "Save changes");
    await expect(admin).toHaveURL(/\/admin\?success=saved$/);
    await other.getByLabel("Your comment", { exact: true }).fill("Article must reject this.");
    await submit(other, "Post comment");
    await expect(other.getByRole("alert")).toContainText("comments are disabled");
    assert.equal(await db.comment.count({ where: { body: "Article must reject this." } }), 0);

    const protectedComment = await db.comment.create({ data: { body: "Other member comment", userId: otherUser.id, contentId: privateArticle.id } });
    const ownComment = await db.comment.findFirstOrThrow({ where: { userId: reader.id } });
    member.on("dialog", (dialog) => dialog.accept());
    const deleteRequest = await submit(member, "Delete my comment");
    await expect(member.getByText("A useful explanation.", { exact: true })).toHaveCount(0);
    await replay(deleteRequest, memberContext, ownComment.id, protectedComment.id);
    assert(await db.comment.findUnique({ where: { id: protectedComment.id } }), "Members cannot delete another user's comment");

    await admin.goto(`${baseUrl}/admin/content/new`);
    await admin.getByLabel("Article title", { exact: true }).fill("Lifecycle article");
    await admin.getByLabel("URL slug", { exact: true }).fill("lifecycle-article");
    await admin.getByLabel(/Short summary/).fill("Lifecycle preview");
    await admin.getByLabel("Article content", { exact: true }).fill("Lifecycle private draft body");
    await submit(admin, "Save article");
    await expect(admin).toHaveURL(/\/admin\?success=saved$/);
    const lifecycle = await db.content.findUniqueOrThrow({ where: { slug: "lifecycle-article" } });
    assert.equal(lifecycle.status, "draft");
    assert(!(await (await guest.request.get(`${baseUrl}/blog/lifecycle-article`)).text()).includes(lifecycle.body));
    await admin.goto(`${baseUrl}/admin/content/${lifecycle.id}/edit`);
    await admin.getByLabel("Status", { exact: true }).selectOption("published");
    await admin.getByLabel("Source name", { exact: true }).fill("Reference");
    await admin.getByLabel("Source URL (HTTPS)", { exact: true }).fill("https://example.com/reference");
    await submit(admin, "Save changes");
    await expect(admin).toHaveURL(/\/admin\?success=saved$/);
    assert.equal((await db.content.findUniqueOrThrow({ where: { id: lifecycle.id } })).status, "published");
    await db.comment.create({ data: { body: "Cascade comment", userId: otherUser.id, contentId: lifecycle.id } });
    await db.like.create({ data: { userId: otherUser.id, contentId: lifecycle.id } });
    admin.on("dialog", (dialog) => dialog.accept());
    const articleCard = admin.getByRole("listitem").filter({ has: admin.getByRole("heading", { name: "Lifecycle article", exact: true }) });
    await articleCard.getByRole("button", { name: "Delete article", exact: true }).click();
    await expect(admin).toHaveURL(/\/admin\?success=deleted$/);
    assert.equal(await db.content.findUnique({ where: { id: lifecycle.id } }), null);
    assert.equal(await db.comment.count({ where: { contentId: lifecycle.id } }), 0);
    assert.equal(await db.like.count({ where: { contentId: lifecycle.id } }), 0);

    await member.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(member).toHaveURL(`${baseUrl}/`);
    await member.goto(`${baseUrl}/blog/member-test`);
    await expect(member.getByRole("link", { name: "Sign in or register" })).toBeVisible();
    await db.userSession.updateMany({ where: { userId: otherUser.id }, data: { expiresAt: new Date(0) } });
    await other.reload();
    await expect(other.getByRole("link", { name: "Sign in or register" })).toBeVisible();
    await guest.setViewportSize({ width: 390, height: 844 });
    await guest.goto(baseUrl);
    await expect(guest.getByRole("link", { name: "Edited public article", exact: true })).toBeVisible();
    assert(await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Mobile page must not overflow horizontally");
    await guest.screenshot({ path: "/tmp/wom-blog-mobile.png", fullPage: true });
    assert.deepEqual(pageErrors, []);
    console.log("Passed: member login, idempotent likes, forged requests, comment blocks, article switches, ownership, logout, and expiry.");
  } catch (error) {
    console.error(serverOutput.slice(-6000));
    throw error;
  } finally {
    await browser?.close();
    if (server && server.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
    await db.$disconnect();
    // Only the uniquely named schema created by this test is removed.
    await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
