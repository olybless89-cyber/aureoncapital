import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { sendWelcomeEmail } from "../lib/email";

const router: IRouter = Router();

const JWT_SECRET = process.env.SESSION_SECRET ?? "stocktrade-pro-secret-key";

function makeToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

function makeMemberCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `ST-${part(4)}-${part(4)}`;
}

function toPublicUser(u: typeof usersTable.$inferSelect) {
  const { passwordHash: _, ...pub } = u;
  return pub;
}

function toLoginUser(u: typeof usersTable.$inferSelect) {
  const { passwordHash: _, mustChangePassword, ...rest } = u;
  return { ...rest, mustChangePassword: mustChangePassword ?? false };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (user.status === "suspended") {
    res.status(401).json({ message: "Account suspended. Contact support." });
    return;
  }

  const token = makeToken(user.id);
  req.log.info({ userId: user.id }, "User logged in");
  res.json({ user: toLoginUser(user), token });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { email, password, firstName, lastName, phone } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(400).json({ message: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();
  const memberCode = makeMemberCode();

  const [user] = await db.insert(usersTable).values({
    id,
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    phone: phone ?? null,
    role: "user",
    // Registration is free (no payment required), but new accounts still
    // start "pending" -- an admin must manually approve the account (flip
    // status to "active" from Admin > Users, see routes/users.ts PATCH
    // /users/:userId) before the user can access their dashboard. See
    // PendingApprovalGate.tsx / AppLayout.tsx for the gate shown while
    // pending.
    status: "pending",
    balance: 0,
    rewardPoints: 0,
    referralCount: 0,
    memberCode,
  }).returning();

  const token = makeToken(user.id);
  req.log.info({ userId: user.id }, "User registered");

  // Send welcome email (non-blocking)
  sendWelcomeEmail({ email: user.email, firstName: user.firstName, memberCode: user.memberCode }).catch(() => {});

  res.status(201).json({ user: toPublicUser(user), token });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  let payload: { sub: string };
  try {
    payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub));
  if (!user) {
    res.status(401).json({ message: "User not found" });
    return;
  }

  res.json(toPublicUser(user));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  let payload: { sub: string };
  try {
    payload = jwt.verify(auth.slice(7), JWT_SECRET) as { sub: string };
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  const { newPassword } = req.body ?? {};
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.sub));
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable)
    .set({ passwordHash, mustChangePassword: false })
    .where(eq(usersTable.id, user.id));

  req.log.info({ userId: user.id }, "Password changed");
  res.json({ message: "Password updated successfully" });
});

export { JWT_SECRET };
export default router;
