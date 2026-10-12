import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "wom_user_session";
const SESSION_SECONDS = 60 * 60 * 8;

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function getUserSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: digest(token) },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          isActive: true,
          canComment: true,
        },
      },
    },
  });

  if (
    !session ||
    session.expiresAt.getTime() <= Date.now() ||
    !session.user.isActive
  ) {
    return null;
  }

  return session.user;
}

export async function createUserSession(userId: string) {
  const cookieStore = await cookies();
  const previousToken = cookieStore.get(COOKIE_NAME)?.value;

  if (previousToken) {
    await prisma.userSession.deleteMany({
      where: { tokenHash: digest(previousToken) },
    });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);

  await prisma.userSession.create({
    data: {
      userId,
      tokenHash: digest(token),
      expiresAt,
    },
  });

  await prisma.userSession.deleteMany({ where: { expiresAt: { lte: new Date() } } });

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
    expires: expiresAt,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.userSession.deleteMany({
      where: { tokenHash: digest(token) },
    });
  }

  cookieStore.delete(COOKIE_NAME);
}
