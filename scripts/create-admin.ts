import "dotenv/config";
import { createHash } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

async function hiddenPassword(prompt: string): Promise<string> {
  if (!stdin.isTTY) throw new Error("Use an interactive terminal or set ADMIN_EMAIL and ADMIN_PASSWORD in your environment.");
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let password = "";
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Admin setup cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(password);
          return;
        }
        if (character === "\u007f" || character === "\b") password = password.slice(0, -1);
        else if (character >= " ") password += character;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;
  if (!email) {
    if (!stdin.isTTY) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD, or run this command in an interactive terminal.");
    const input = createInterface({ input: stdin, output: stdout });
    email = (await input.question("Admin email: ")).trim().toLowerCase();
    input.close();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Please use a valid email address.");
  if (!password) {
    password = await hiddenPassword("Admin password (at least 12 characters): ");
    if (password !== await hiddenPassword("Confirm password: ")) throw new Error("Passwords did not match.");
  }
  if (password.length < 12 || password.length > 1024) throw new Error("Use a password between 12 and 1024 characters.");
  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (transaction) => {
    const admin = await transaction.admin.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    // A password reset and revocation must succeed together, so an old session
    // cannot survive a partially completed reset.
    await transaction.adminSession.deleteMany({ where: { adminId: admin.id } });
    const key = createHash("sha256").update(email).digest("hex");
    await transaction.loginAttempt.deleteMany({ where: { key } });
  });
  console.log(`Admin account ready for ${email}. Sign in at /admin/login.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Admin setup failed.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
