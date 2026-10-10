import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3107";
const credentialsFile = process.env.TEST_CREDENTIALS_FILE;

function decodeHtml(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function formFromHtml(html: string, marker: string) {
  const form = html.match(/<form\b[\s\S]*?<\/form>/g)?.find((item) => item.includes(marker));
  assert.ok(form, `Could not find form ${marker}`);
  const data = new FormData();
  for (const input of form.match(/<input\b[^>]*>/g) ?? []) {
    if (!input.includes('type="hidden"')) continue;
    const name = input.match(/\bname="([^"]*)"/)?.[1];
    const value = input.match(/\bvalue="([^"]*)"/)?.[1] ?? "";
    if (name) data.append(decodeHtml(name), decodeHtml(value));
  }
  return data;
}

async function request(path: string, cookie = "", options: RequestInit = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    redirect: "manual",
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
  });
  return { response, html: await response.text() };
}

async function post(path: string, form: FormData, cookie = "", origin = baseUrl) {
  return request(path, cookie, { method: "POST", body: form, headers: { Origin: new URL(origin).origin } });
}

function fields(form: FormData, values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

async function main() {
  assert.ok(credentialsFile, "Set TEST_CREDENTIALS_FILE to the private credentials JSON for an isolated test server.");
  const credentials: { email: string; password: string; database: string } = JSON.parse(readFileSync(credentialsFile, "utf8"));
  // Never run mutation tests against the real site's database.
  assert.ok(realpathSync(credentials.database).startsWith(`${realpathSync(tmpdir())}${sep}wom-backend-qa-`), "Integration tests require a temporary wom-backend-qa-* database.");
  process.env.CMS_DATABASE_URL = `file:${credentials.database}`;
  const { prisma } = await import("../src/lib/db");
  const manifest = JSON.parse(readFileSync(resolve(".next/server/server-reference-manifest.json"), "utf8")) as {
    node: Record<string, { exportedName?: string }>;
  };
  function action(name: string) {
    const id = Object.entries(manifest.node).find(([, value]) => value.exportedName === name)?.[0];
    assert.ok(id, `Missing server action ${name}`);
    const form = new FormData();
    form.set("$ACTION_REF_1", "");
    form.set("$ACTION_1:0", JSON.stringify({ id, bound: "$@1" }));
    form.set("$ACTION_1:1", "[{}]");
    return form;
  }

  const originalSettings = await prisma.siteSettings.findUniqueOrThrow({ where: { id: "main" } });
  const slug = `qa-http-${randomUUID()}`;
  const editedSlug = `${slug}-edited`;
  const title = `QA article ${randomUUID()}`;
  const data = {
    title, slug, category: "wellness", summary: "Temporary QA summary.", body: "Temporary QA educational article.",
    imageUrl: "", tag: "QA", readTime: "3", status: "draft", sourceName: "NHS", sourceUrl: "https://www.nhs.uk/",
  };
  let cookie = "";
  let settingsChanged = false;
  async function login() {
    const page = await request("/admin/login");
    const form = fields(formFromHtml(page.html, "admin-login-form"), { email: credentials.email, password: credentials.password });
    const result = await post("/admin/login", form);
    assert.equal(result.response.status, 303, "Valid login must redirect");
    assert.equal(result.response.headers.get("location"), "/admin");
    const setCookie = result.response.headers.get("set-cookie") ?? "";
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=strict/i);
    assert.match(setCookie, /Secure/i);
    cookie = setCookie.split(";")[0];
    assert.ok(cookie.startsWith("wom_admin_session="));
  }
  async function editorForm(path: string) {
    const page = await request(path, cookie);
    assert.equal(page.response.status, 200);
    return formFromHtml(page.html, "admin-editor-form");
  }

  try {
    const anonymous = await request("/admin");
    assert.equal(anonymous.response.status, 307);
    assert.equal(anonymous.response.headers.get("location"), "/admin/login");
    const countBefore = await prisma.content.count();
    for (const name of ["saveContentAction", "deleteContentAction", "saveSettingsAction"]) {
      const result = await post("/admin", fields(action(name), data));
      assert.equal(result.response.status, 303, `${name} must reject anonymous requests`);
      assert.equal(result.response.headers.get("location"), "/admin/login");
    }
    assert.equal(await prisma.content.count(), countBefore);
    console.log("Passed: protected routes and direct unauthorized mutation requests.");

    const loginPage = await request("/admin/login");
    const wrong = await post("/admin/login", fields(formFromHtml(loginPage.html, "admin-login-form"), { email: credentials.email, password: "incorrect-password" }));
    assert.equal(wrong.response.status, 200);
    assert.match(wrong.html, /email or password is incorrect/);
    await login();
    assert.equal((await request("/admin", cookie)).response.status, 200);
    const token = cookie.split("=")[1];
    const tokenHash = createHash("sha256").update(token).digest("hex");
    assert.ok(await prisma.adminSession.findUnique({ where: { tokenHash } }));
    assert.equal(await prisma.adminSession.findUnique({ where: { tokenHash: token } }), null);
    console.log("Passed: login errors, successful authentication, secure cookie flags, and hashed session storage.");

    const create = await post("/admin/content/new", fields(await editorForm("/admin/content/new"), data), cookie);
    assert.equal(create.response.status, 303);
    const entry = await prisma.content.findUniqueOrThrow({ where: { slug } });
    assert.equal((await request(`/library/${slug}`)).response.status, 404, "Drafts must not be public");
    const editPath = `/admin/content/${entry.id}`;
    const unsafe = await post(editPath, fields(await editorForm(editPath), { ...data, status: "published", sourceUrl: "javascript:alert(1)" }), cookie);
    assert.equal(unsafe.response.status, 200);
    assert.match(unsafe.html, /Source URL must be a valid HTTPS URL/);
    assert.equal((await prisma.content.findUniqueOrThrow({ where: { id: entry.id } })).status, "draft");
    const missingSource = await post(editPath, fields(await editorForm(editPath), { ...data, status: "published", sourceName: "", sourceUrl: "" }), cookie);
    assert.match(missingSource.html, /Add a source name and source URL/);
    const csrf = await post(editPath, fields(await editorForm(editPath), { ...data, status: "published" }), cookie, "https://untrusted.example");
    assert.ok(csrf.response.status >= 400, "Cross-origin server actions must fail");
    assert.equal((await prisma.content.findUniqueOrThrow({ where: { id: entry.id } })).status, "draft");
    console.log("Passed: draft privacy, unsafe source rejection, required references, and CSRF origin checks.");

    const publish = await post(editPath, fields(await editorForm(editPath), { ...data, status: "published" }), cookie);
    assert.equal(publish.response.status, 303);
    const published = await request(`/library/${slug}`);
    assert.equal(published.response.status, 200);
    assert.ok(published.html.includes(title));
    const edit = await post(editPath, fields(await editorForm(editPath), { ...data, slug: editedSlug, status: "published", body: "Updated persisted article content." }), cookie);
    assert.equal(edit.response.status, 303);
    assert.equal((await request(`/library/${slug}`)).response.status, 404);
    assert.match((await request(`/library/${editedSlug}`)).html, /Updated persisted article content/);

    const settingsPage = await request("/admin/settings", cookie);
    const settingsForm = formFromHtml(settingsPage.html, 'name="siteName"');
    for (const [key, value] of Object.entries(originalSettings)) {
      if (typeof value === "string" && key !== "id") settingsForm.set(key, value);
    }
    const heroTitle = `Editable homepage ${randomUUID()}`;
    settingsForm.set("heroTitle", heroTitle);
    const savedSettings = await post("/admin/settings", settingsForm, cookie);
    assert.equal(savedSettings.response.status, 200);
    settingsChanged = true;
    assert.ok((await request("/")).html.includes(heroTitle), "The homepage must read saved settings at request time");
    console.log("Passed: create/publish/edit persistence, changed-slug invalidation, and live homepage settings.");

    const deleted = await post(editPath, fields(action("deleteContentAction"), { id: entry.id }), cookie);
    assert.equal(deleted.response.status, 303);
    assert.equal(await prisma.content.findUnique({ where: { id: entry.id } }), null);
    assert.equal((await request(`/library/${editedSlug}`)).response.status, 404);
    const dashboard = await request("/admin", cookie);
    const logout = await post("/admin", formFromHtml(dashboard.html, "$ACTION_ID_"), cookie);
    assert.equal(logout.response.status, 303);
    assert.equal((await request("/admin", cookie)).response.status, 307, "A logged-out token must not be reusable");
    assert.equal(await prisma.adminSession.findUnique({ where: { tokenHash } }), null);
    await login();
    await prisma.adminSession.updateMany({ data: { expiresAt: new Date(0) } });
    assert.equal((await request("/admin", cookie)).response.status, 307, "Expired sessions must be rejected");
    await login();
    execFileSync(process.execPath, ["--import", "tsx", "scripts/create-admin.ts"], {
      env: { ...process.env, ADMIN_EMAIL: credentials.email, ADMIN_PASSWORD: credentials.password },
      stdio: "pipe",
    });
    assert.equal((await request("/admin", cookie)).response.status, 307, "Password reset must revoke all old sessions");
    assert.equal(await prisma.adminSession.count(), 0);
    console.log("Passed: authenticated deletion, logout/token replay, session expiry, and password-reset revocation.");
  } finally {
    await prisma.content.deleteMany({ where: { slug: { in: [slug, editedSlug] } } });
    if (settingsChanged) {
      const { id, updatedAt: _updatedAt, ...settings } = originalSettings;
      void _updatedAt;
      await prisma.siteSettings.update({ where: { id }, data: settings });
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "HTTP integration tests failed.");
  process.exitCode = 1;
});
