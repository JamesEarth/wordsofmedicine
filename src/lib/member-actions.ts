"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAdminSession, requireAdmin } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  clearUserSession,
  createUserSession,
  getUserSession,
} from "@/lib/user-auth";
import type { ActionState } from "@/lib/admin-actions";
import { safeReturnPath } from "@/lib/return-path";

class InputError extends Error {}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function field(
  form: FormData,
  name: string,
  maxLength: number,
  required = true
) {
  const raw = form.get(name);

  if (raw === null && !required) return "";

  if (typeof raw !== "string") {
    throw new InputError(`Please check ${name}.`);
  }

  const value = raw.trim();

  if ((required && !value) || value.length > maxLength) {
    throw new InputError(`Please check ${name}.`);
  }

  return value;
}

function passwordField(form: FormData, minimum: number) {
  const password = form.get("password");

  // Passwords must not be trimmed.
  if (
    typeof password !== "string" ||
    password.length < minimum ||
    password.length > 1024
  ) {
    throw new InputError(
      `Password must contain ${minimum}–1024 characters.`
    );
  }

  return password;
}

function emailField(form: FormData) {
  const email = field(form, "email", 254).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputError("Please enter a valid email.");
  }

  return email;
}

function integerField(form: FormData, name: string, maximum: number) {
  const value = Number(field(form, name, 8));

  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new InputError(`${name} must be between 1 and ${maximum}.`);
  }

  return value;
}

function validateCode(code: string) {
  if (!/^[a-z0-9_-]{16,80}$/.test(code)) {
    throw new InputError(
      "Invitation codes need 16–80 letters, numbers, underscores, or hyphens."
    );
  }
}

function failure(error: unknown): ActionState {
  if (error instanceof InputError) {
    return { error: error.message };
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return { error: "One of these unique values is already in use." };
  }

  console.error("Member action failed", error);
  return { error: "The request could not be completed. Please try again." };
}

export async function registerUserAction(
  _previous: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const email = emailField(form);
    const username = field(form, "username", 30).toLowerCase();
    const password = passwordField(form, 12);
    const code = field(form, "invitationCode", 80).toLowerCase();

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      throw new InputError(
        "Username needs 3–30 letters, numbers, or underscores."
      );
    }

    validateCode(code);

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.invite.updateMany({
        where: {
          codeHash: digest(code),
          isActive: true,
          usedCount: { lt: tx.invite.fields.maxUses },
        },
        data: {
          usedCount: { increment: 1 },
        },
      });

      if (claimed.count !== 1) {
        throw new InputError(
          "The invitation is invalid, disabled, or fully used."
        );
      }

      await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
        },
      });
    });

    return { success: "Account created. You can now sign in." };
  } catch (error) {
    return failure(error);
  }
}

export async function loginUserAction(
  _previous: ActionState,
  form: FormData
): Promise<ActionState> {
  try {
    const email = emailField(form);
    const password = passwordField(form, 1);

    // Five attempts per email in each fixed 15-minute window.
    const windowMs = 15 * 60 * 1000;
    const windowNumber = Math.floor(Date.now() / windowMs);
    const key = digest(`member-login:${email}:${windowNumber}`);

    const attempt = await prisma.loginAttempt.upsert({
      where: { key },
      create: { key, attempts: 1 },
      update: { attempts: { increment: 1 } },
    });

    if (attempt.attempts > 5) {
      throw new InputError("Too many attempts. Try again in 15 minutes.");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    const dummyHash = `scrypt:${"0".repeat(64)}:${"0".repeat(128)}`;
    const valid = await verifyPassword(
      password,
      user?.passwordHash ?? dummyHash
    );

    if (!user || !valid || !user.isActive) {
      throw new InputError("The email or password is incorrect.");
    }

    await createUserSession(user.id);

    await prisma.loginAttempt.deleteMany({
      where: {
        windowStart: { lt: new Date(Date.now() - windowMs) },
      },
    });
  } catch (error) {
    return failure(error);
  }

  redirect(safeReturnPath(form.get("next")));
}

export async function logoutUserAction() {
  await clearUserSession();
  redirect("/");
}

export async function saveInviteAction(
  _previous: ActionState,
  form: FormData
): Promise<ActionState> {
  await requireAdmin();

  try {
    const id = field(form, "id", 100, false);
    const maxUses = integerField(form, "maxUses", 10000);
    const suppliedCode = field(form, "code", 80, false).toLowerCase();
    const isActive = form.get("isActive") === "on";

    if (suppliedCode) validateCode(suppliedCode);

    if (id) {
      const updated = await prisma.invite.updateMany({
        where: {
          id,
          usedCount: { lte: maxUses },
        },
        data: {
          maxUses,
          isActive,
          ...(suppliedCode
            ? { codeHash: digest(suppliedCode) }
            : {}),
        },
      });

      if (updated.count !== 1) {
        throw new InputError(
          "Invitation missing, or the limit is below its current usage."
        );
      }

      revalidatePath("/admin");

      return {
        success: suppliedCode
          ? `Invitation updated. New code: ${suppliedCode}`
          : "Invitation updated.",
      };
    }

    const count = integerField(form, "count", 100);

    if (suppliedCode && count !== 1) {
      throw new InputError(
        "A custom code can only be used when creating one invitation."
      );
    }

    const codes = Array.from(
      { length: count },
      () => suppliedCode || randomBytes(16).toString("hex")
    );

    await prisma.invite.createMany({
      data: codes.map((code) => ({
        codeHash: digest(code),
        maxUses,
        isActive,
      })),
    });

    revalidatePath("/admin");

    return {
      success: `Copy these codes now:\n${codes.join("\n")}`,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function setCommentPermissionAction(
  _previous: ActionState,
  form: FormData
): Promise<ActionState> {
  await requireAdmin();

  try {
    const userId = field(form, "userId", 100);

    const result = await prisma.user.updateMany({
      where: { id: userId },
      data: {
        canComment: form.get("canComment") === "on",
      },
    });

    if (result.count !== 1) {
      throw new InputError("User not found.");
    }

    revalidatePath("/", "layout");
    return { success: "Comment permission saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function addCommentAction(
  _previous: ActionState,
  form: FormData
): Promise<ActionState> {
  const user = await getUserSession();

  if (!user) return { error: "Please sign in." };
  if (!user.canComment) {
    return { error: "Commenting is disabled for your account." };
  }

  try {
    const contentId = field(form, "contentId", 100);
    const body = field(form, "body", 2000);

    const article = await prisma.content.findFirst({
      where: {
        id: contentId,
        status: "published",
        commentsEnabled: true,
      },
      select: { id: true },
    });

    if (!article) {
      throw new InputError(
        "This article is unavailable or its comments are disabled."
      );
    }

    await prisma.comment.create({
      data: {
        body,
        contentId: article.id,
        userId: user.id,
      },
    });

    revalidatePath("/", "layout");
    return { success: "Comment posted." };
  } catch (error) {
    return failure(error);
  }
}

export async function setLikeAction(
  _previous: ActionState,
  form: FormData
): Promise<ActionState> {
  const user = await getUserSession();
  if (!user) return { error: "Please sign in." };

  try {
    const contentId = field(form, "contentId", 100);
    const liked = field(form, "liked", 5);

    if (liked !== "true" && liked !== "false") {
      throw new InputError("Invalid like value.");
    }

    const article = await prisma.content.findFirst({
      where: { id: contentId, status: "published" },
      select: { id: true },
    });

    if (!article) throw new InputError("Article not found.");

    if (liked === "true") {
      await prisma.like.createMany({
        data: [{ userId: user.id, contentId }],
        skipDuplicates: true,
      });
    } else {
      await prisma.like.deleteMany({
        where: { userId: user.id, contentId },
      });
    }

    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCommentAction(
  _previous: ActionState,
  form: FormData
): Promise<ActionState> {
  const [user, admin] = await Promise.all([
    getUserSession(),
    getAdminSession(),
  ]);

  if (!user && !admin) return { error: "Please sign in." };

  try {
    const id = field(form, "id", 100);

    const result = await prisma.comment.deleteMany({
      where: {
        id,
        ...(admin ? {} : { userId: user!.id }),
      },
    });

    if (result.count !== 1) {
      throw new InputError("Comment unavailable or permission denied.");
    }

    revalidatePath("/", "layout");
    return { success: "Comment deleted." };
  } catch (error) {
    return failure(error);
  }
}
