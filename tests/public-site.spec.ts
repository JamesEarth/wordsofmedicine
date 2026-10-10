import { test, expect } from "@playwright/test";

test("homepage, search, and guide links work", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator(".topic-card")).toHaveCount(5);
  await expect(page.locator(".article-card").first()).toBeVisible();
  await page.locator("#home-search").fill("Paracetamol");
  await page.getByRole("button", { name: "Search library", exact: true }).click();
  await expect(page).toHaveURL(/library\?q=Paracetamol/);
  await expect(page.locator(".article-card").first()).toBeVisible();
  await page.locator(".article-card h3 a").first().click();
  await expect(page.locator(".article-body")).toBeVisible();
  await expect(page.locator(".source-box a")).toHaveAttribute("href", /^https:\/\//);
  expect(errors).toEqual([]);
});

test("category filters, empty results, and clear navigation work", async ({ page }) => {
  await page.goto("/library?category=instruments");
  await expect(page.locator(".library-hero h1")).toHaveText("Medical instruments");
  await expect(page.locator(".article-card").first()).toBeVisible();
  await page.getByRole("link", { name: "All topics", exact: true }).click();
  await expect(page.locator(".library-hero h1")).toHaveText("Your health. A little clearer.");
  await page.locator("#library-search").fill("zxqv-no-matching-health-topic");
  await page.getByRole("button", { name: "Search library", exact: true }).click();
  await expect(page.locator(".empty-state")).toBeVisible();
  await page.getByRole("link", { name: "Explore all guides", exact: true }).click();
  await expect(page.locator(".article-card").first()).toBeVisible();
});

test("admin pages require authentication", async ({ page }) => {
  for (const path of ["/admin", "/admin/settings", "/admin/content/new"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator(".admin-login-page")).toBeVisible();
  }
});

test("pages fit the viewport and mobile navigation opens", async ({ page, isMobile }) => {
  for (const path of ["/", "/library", "/about", "/admin/login"]) {
    await page.goto(path);
    await expect(page.locator("main").first()).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content, `Overflow on ${path}`).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
  if (isMobile) {
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Medicines", exact: true }).click();
    await expect(page).toHaveURL(/category=medicines/);
  }
});
