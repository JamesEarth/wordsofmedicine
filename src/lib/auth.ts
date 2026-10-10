import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { verifyPassword } from "./password";

const COOKIE_NAME = "wom_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 5;
const DUMMY_PASSWORD_HASH = `scrypt:${"0".repeat(64)}:${"0".repeat(128)}`;

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function isAdminConfigured() {
  return (await prisma.admin.count()) > 0;
}

export async function getAdminSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: digest(token) },
    include: { admin: { select: { id: true, email: true, displayName: true } } },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  return session.admin;
}

export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function authenticateAdmin(email: string, password: string) {
  const key = digest(email.toLowerCase());
  const now = new Date();
  const cutoff = new Date(now.getTime() - LOGIN_WINDOW_MS);

  // Persist throttling across restarts. Increment before password verification so
  // concurrent requests cannot all pass the limit before their hash completes.
  const allowed = await prisma.$transaction(async (transaction) => {
    const attempt = await transaction.loginAttempt.findUnique({ where: { key } });
    if (attempt && attempt.windowStart > cutoff && attempt.attempts >= LOGIN_ATTEMPT_LIMIT) return false;
    if (!attempt || attempt.windowStart <= cutoff) {
      await transaction.loginAttempt.upsert({
        where: { key },
        update: { attempts: 1, windowStart: now },
        create: { key, attempts: 1, windowStart: now },
      });
    } else {
      await transaction.loginAttempt.update({ where: { key }, data: { attempts: { increment: 1 } } });
    }
    return true;
  });

  if (!allowed) return { error: "Too many sign-in attempts. Please try again in 15 minutes." };

  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  const valid = await verifyPassword(password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!admin || !valid) return { error: "The email or password is incorrect." };

  await prisma.loginAttempt.deleteMany({ where: { key } });
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lte: now } } });
  // Periodically remove stale rate-limit keys without retaining entered emails.
  await prisma.loginAttempt.deleteMany({ where: { windowStart: { lt: cutoff } } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + SESSION_SECONDS * 1000);
  await prisma.adminSession.create({ data: { adminId: admin.id, tokenHash: digest(token), expiresAt } });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
    expires: expiresAt,
  });
  return { success: true };
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { tokenHash: digest(token) } });
  cookieStore.delete(COOKIE_NAME);
}
