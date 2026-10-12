"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticateAdmin, clearAdminSession, requireAdmin } from "./auth";
import { prisma } from "./db";

export type ActionState = { error?: string; success?: string };

const categories = new Set(["medicines", "conditions", "instruments", "wellness", "first-aid"]);

function field(form: FormData, name: string, maxLength: number, required = true) {
  const value = form.get(name);
  if (typeof value !== "string") {
    if (required) throw new Error(`Please enter ${name.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
    return "";
  }
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`Please enter ${name.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
  if (normalized.length > maxLength) throw new Error(`${name} must be ${maxLength} characters or fewer.`);
  return normalized;
}

function validateUrl(value: string, label: string, allowLocal = false) {
  if (!value) return;
  if (allowLocal && /^\/(?!\/)[a-zA-Z0-9/_ .%-]+$/.test(value)) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error();
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL${allowLocal ? " or a local image path" : ""}.`);
  }
}

function databaseError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  if (code === "P2002") return "This URL slug is already in use. Please choose a different slug.";
  if (code === "P2025") return "This entry no longer exists. Refresh the content list and try again.";
  console.error("CMS update failed", error);
  return "The change could not be saved. Please try again.";
}

export async function loginAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  let email: string;
  let password: string;
  try {
    email = field(form, "email", 254).toLowerCase();
    const value = form.get("password");
    if (typeof value !== "string" || !value || value.length > 1024) return { error: "Please enter your email and password." };
    password = value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Please enter your email and password." };
  }
  const result = await authenticateAdmin(email, password);
  if (result.error) return { error: result.error };
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function saveContentAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  let id: string;
  let data;
  try {
    id = field(form, "id", 100, false);
    const slug = field(form, "slug", 150);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("The URL slug can only contain lowercase letters, numbers, and hyphens.");
    const category = field(form, "category", 30);
    if (!categories.has(category)) throw new Error("Please choose a valid category.");
    const status = field(form, "status", 20);
    if (status !== "draft" && status !== "published") throw new Error("Please choose draft or published.");
    const readTime = Number(field(form, "readTime", 3));
    if (!Number.isInteger(readTime) || readTime < 1 || readTime > 120) throw new Error("Reading time must be between 1 and 120 minutes.");
    const imageUrl = field(form, "imageUrl", 2000, false);
    const sourceUrl = field(form, "sourceUrl", 2000, false);
    const sourceName = field(form, "sourceName", 200, false);
    validateUrl(imageUrl, "Image URL", true);
    validateUrl(sourceUrl, "Source URL");
    if (status === "published" && (!sourceUrl || !sourceName)) throw new Error("Add a source name and source URL before publishing health information.");
    data = {
      slug,
      title: field(form, "title", 200),
      category,
      summary: field(form, "summary", 1000),
      body: field(form, "body", 100000),
      imageUrl,
      tag: field(form, "tag", 80, false),
      readTime,
      status,
      featured: form.get("featured") === "on" || form.get("featured") === "true",
      requiresLogin: form.get("requiresLogin") === "on",
      commentsEnabled: form.get("commentsEnabled") === "on",
      sourceName,
      sourceUrl,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Please check the content fields." };
  }

  try {
    if (id) await prisma.content.update({ where: { id }, data });
    else await prisma.content.create({ data });
  } catch (error) {
    return { error: databaseError(error) };
  }
  revalidatePath("/", "layout");
  redirect("/admin?success=saved");
}

export async function deleteContentAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  let id: string;
  try {
    id = field(form, "id", 100);
  } catch {
    return { error: "Please select an entry to delete." };
  }
  try {
    await prisma.content.delete({ where: { id } });
  } catch (error) {
    return { error: databaseError(error) };
  }
  revalidatePath("/", "layout");
  redirect("/admin?success=deleted");
}

export async function saveSettingsAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  let data;
  try {
    const contactEmail = field(form, "contactEmail", 254, false);
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new Error("Please enter a valid contact email.");
    const heroImageUrl = field(form, "heroImageUrl", 2000, false);
    validateUrl(heroImageUrl, "Hero image URL", true);
    data = {
      siteName: field(form, "siteName", 100),
      tagline: field(form, "tagline", 200),
      heroTitle: field(form, "heroTitle", 250),
      heroDescription: field(form, "heroDescription", 1000),
      heroEyebrow: field(form, "heroEyebrow", 150),
      heroImageUrl,
      heroImageCaption: field(form, "heroImageCaption", 250),
      topicsTitle: field(form, "topicsTitle", 250),
      topicsDescription: field(form, "topicsDescription", 1000),
      featuredTitle: field(form, "featuredTitle", 250),
      featuredDescription: field(form, "featuredDescription", 1000),
      indexTitle: field(form, "indexTitle", 250),
      indexDescription: field(form, "indexDescription", 1000),
      missionTitle: field(form, "missionTitle", 250),
      missionDescription: field(form, "missionDescription", 2000),
      aboutText: field(form, "aboutText", 10000),
      contactEmail,
      footerText: field(form, "footerText", 1000),
      disclaimer: field(form, "disclaimer", 2000),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Please check the settings fields." };
  }
  try {
    await prisma.siteSettings.update({ where: { id: "main" }, data });
  } catch (error) {
    return { error: databaseError(error) };
  }
  revalidatePath("/", "layout");
  return { success: "Website settings saved. Your changes are now live." };
}

export async function publishContentAction(
  _previous: ActionState,
  form: FormData
): Promise<ActionState> {
  await requireAdmin();

  let id: string;
  let sourceName: string;
  let sourceUrl: string;

  try {
    id = field(form, "id", 100);
    sourceName = field(form, "sourceName", 200);
    sourceUrl = field(form, "sourceUrl", 2000);

    validateUrl(sourceUrl, "Source URL");
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Please check the source details.",
    };
  }

  try {
    await prisma.content.update({
      where: { id },
      data: {
        status: "published",
        sourceName,
        sourceUrl,
      },
    });
  } catch (error) {
    return { error: databaseError(error) };
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}
