import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { JWT_SECRET } from "../routes/auth";

export type UserRow = typeof usersTable.$inferSelect;
export type AuthedRequest = Request & { user?: UserRow };

export async function authenticate(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
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

  req.user = user;
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  return authenticate(req, res, function proceed() {
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Forbidden - Admin access required" });
      return;
    }
    next();
  });
}

// Allows admins to act on any user, and regular users only on themselves.
export function requireSelfOrAdminBy(paramName: string) {
  return async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> =>
    authenticate(req, res, function proceed() {
      const raw = (req.params as Record<string, unknown>)[paramName];
      const target = Array.isArray(raw) ? (raw[0] as string) : (raw as string | undefined);
      if (req.user?.role !== "admin" && target !== req.user?.id) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      next();
    });
}
