import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { Resend } from "resend";
import { db, usersTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM_EMAIL = process.env.EMAIL_FROM ?? "Aureon Capital <noreply@swiftcargoexpressdelivery.com>";

router.post("/admin/email/single", requireAdmin, async (req, res): Promise<void> => {
  const { userId, subject, message } = req.body as { userId?: string; subject?: string; message?: string };
  
  if (!userId || !subject || !message) {
    res.status(400).json({ message: "userId, subject, and message are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const email = user.email;
  if (!email) {
    res.status(400).json({ message: "This user has no email address on file" });
    return;
  }

  const resend = getResend();
  if (!resend) {
    res.status(503).json({ message: "RESEND_API_KEY not configured" });
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: message.replace(/\n/g, "<br>"),
    });
    logger.info({ to: email, subject }, "Single admin email sent");
    res.json({ sent: 1 });
  } catch (err: any) {
    logger.error({ err }, "Failed to send admin email");
    res.status(500).json({ message: err?.message ?? "Failed to send email" });
  }
});

router.post("/admin/email/bulk", requireAdmin, async (req, res): Promise<void> => {
  const { subject, message, userIds } = req.body as { subject?: string; message?: string; userIds?: string[] };
  
  if (!subject || !message) {
    res.status(400).json({ message: "subject and message are required" });
    return;
  }

  const resend = getResend();
  if (!resend) {
    res.status(503).json({ message: "RESEND_API_KEY not configured" });
    return;
  }

  // Get target users - specific users or all users
  let targets;
  if (userIds?.length) {
    targets = await db.select().from(usersTable).where(inArray(usersTable.id, userIds));
  } else {
    targets = await db.select().from(usersTable);
  }

  const validTargets = targets.filter(u => !!u.email);
  if (validTargets.length === 0) {
    res.status(400).json({ message: "No users with email addresses found" });
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const u of validTargets) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: u.email as string,
        subject,
        html: message.replace(/\n/g, "<br>"),
      });
      sent++;
    } catch (err) {
      logger.error({ err, userId: u.id }, "Bulk email failed for user");
      failed++;
    }
  }

  logger.info({ sent, failed, subject }, "Bulk email complete");
  res.json({ sent, failed, total: validTargets.length });
});

// Admin-only: send a test email to a single address (defaults to the admin's
// own email) to verify the Resend integration is wired up. Useful from the
// Email Center "Send test email" button or a direct curl call.
router.post("/admin/email/test", requireAdmin, async (req, res): Promise<void> => {
  const { to } = req.body as { to?: string };

  const target = to ?? (req as any).user?.email;
  if (!target) {
    res.status(400).json({ message: "No recipient address available (pass `to`)" });
    return;
  }

  const resend = getResend();
  if (!resend) {
    res.status(503).json({ message: "RESEND_API_KEY not configured" });
    return;
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: target,
      subject: "Aureon Capital — Email Test ✓",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#0a0f1a;color:#e8eaec;max-width:520px;margin:0 auto;padding:40px 32px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:28px;">
            <span style="font-size:18px;font-weight:700;letter-spacing:2px;color:#fff;">AUREON CAPITAL</span>
          </div>
          <h1 style="font-size:22px;font-weight:700;color:#38a169;margin:0 0 12px;">Email Test Successful ✓</h1>
          <p style="color:#8a9bb0;line-height:1.6;margin:0 0 20px;">
            This confirms the Resend integration is working. Transactional emails (welcome, order confirmations, and admin messages) will be delivered from <strong style="color:#fff;">${FROM_EMAIL}</strong>.
          </p>
          <p style="color:#3a4552;font-size:12px;margin-top:32px;">Aureon Capital · Email service test</p>
        </div>
      `,
    });
    logger.info({ to: target, id: (result as { id?: string }).id }, "Test email sent");
    res.json({ sent: 1, to: target, id: (result as { id?: string }).id });
  } catch (err: any) {
    logger.error({ err }, "Test email failed");
    res.status(500).json({ message: err?.message ?? "Failed to send test email" });
  }
});

export default router;
