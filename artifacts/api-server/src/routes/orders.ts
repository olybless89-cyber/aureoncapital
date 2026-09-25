import { Router, type IRouter } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, ordersTable, usersTable } from "@workspace/db";
import { CreateOrderBody, UpdateOrderBody, CreateCopyTradeBody } from "@workspace/api-zod";
import { authenticate, requireAdmin, type AuthedRequest } from "../middlewares/auth";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../lib/email";

const router: IRouter = Router();

// Non-admin callers may only ever see their own orders, regardless of what
// userId they pass in the query string. Admins keep the full filter set.
router.get("/orders", authenticate, async (req: AuthedRequest, res): Promise<void> => {
  const isAdmin = req.user?.role === "admin";
  const { search, status, userId: requestedUserId } = req.query as Record<string, string | undefined>;

  const conditions = [];
  if (!isAdmin) {
    conditions.push(eq(ordersTable.userId, req.user!.id));
  } else if (requestedUserId) {
    conditions.push(eq(ordersTable.userId, requestedUserId));
  }
  if (search) {
    conditions.push(or(
      ilike(ordersTable.userEmail, `%${search}%`),
      ilike(ordersTable.description, `%${search}%`),
      ilike(ordersTable.userName, `%${search}%`),
    ));
  }
  if (status) {
    conditions.push(eq(ordersTable.status, status));
  }

  let query = db.select().from(ordersTable).$dynamic();
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const orders = await query.orderBy(ordersTable.createdAt);
  res.json(orders);
});

router.post("/orders", authenticate, async (req: AuthedRequest, res): Promise<void> => {
  const actingUserId = req.user!.id;

  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, actingUserId));
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const id = crypto.randomUUID();
  const [order] = await db.insert(ordersTable).values({
    id,
    userId: user.id,
    userEmail: user.email,
    userName: `${user.firstName} ${user.lastName}`,
    type: parsed.data.type,
    description: parsed.data.description,
    amount: parsed.data.amount,
    status: "pending",
  }).returning();

  req.log.info({ orderId: id }, "Order created");

  // Send confirmation email (non-blocking)
  sendOrderConfirmationEmail({
    email: user.email,
    firstName: user.firstName,
    type: parsed.data.type,
    description: parsed.data.description,
    amount: parsed.data.amount,
  }).catch(() => {});

  res.status(201).json(order);
});

router.get("/orders/:orderId", authenticate, async (req: AuthedRequest, res): Promise<void> => {
  const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (req.user!.role !== "admin" && order.userId !== req.user!.id) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  res.json(order);
});

router.patch("/orders/:orderId", requireAdmin, async (req, res): Promise<void> => {
  const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;

  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!existing) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  const wasAlreadyFinal = existing.status === "confirmed" || existing.status === "cancelled";

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  req.log.info({ orderId }, "Order updated");

  // Approving a deposit/withdrawal now actually moves money, instead of only
  // flipping the status label and leaving the user's balance untouched.
  // Guarded by wasAlreadyFinal so re-saving an already-confirmed/cancelled
  // order (e.g. an admin re-submitting the same status) never double-applies.
  if (!wasAlreadyFinal && parsed.data.status === "confirmed" && (order.type === "deposit" || order.type === "withdrawal")) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
    if (user) {
      const delta = order.type === "deposit" ? order.amount : -order.amount;
      await db.update(usersTable).set({ balance: user.balance + delta }).where(eq(usersTable.id, user.id));
    }
  }

  // Confirming a membership_fee order (the one-time BTC activation payment
  // from MembershipGate.tsx) is what actually flips a "pending" account to
  // "active" — until then AppLayout blocks the whole app behind the payment
  // gate, regardless of how many orders the user has submitted.
  if (!wasAlreadyFinal && parsed.data.status === "confirmed" && order.type === "membership_fee") {
    await db.update(usersTable).set({ status: "active" }).where(eq(usersTable.id, order.userId));
  }

  // Send status email when confirmed or cancelled (non-blocking)
  if (parsed.data.status === "confirmed" || parsed.data.status === "cancelled") {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));
    if (user) {
      sendOrderStatusEmail({
        email: user.email,
        firstName: user.firstName,
        type: order.type,
        description: order.description,
        amount: order.amount,
        status: parsed.data.status === "confirmed" ? "approved" : "rejected",
      }).catch(() => {});
    }
  }

  res.json(order);
});

// Admin-only: mirror a simulated trade directly into one or more user accounts.
// Unlike the deposit/withdrawal request flow above (user submits, admin later
// approves), this is admin-initiated and applied immediately: it creates an
// already-"confirmed" order per selected user and adjusts their wallet balance
// right away (buy = deduct cash, sell = credit cash), since there's no
// separate shares/holdings ledger in this app — the order history *is* the
// record of what was "copied" into the account.
router.post("/admin/copy-trade", requireAdmin, async (req: AuthedRequest, res): Promise<void> => {
  const admin = req.user!;
  const parsed = CreateCopyTradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { userIds, symbol, side, quantity, price } = parsed.data;
  const amount = Math.round(quantity * price * 100) / 100;
  const createdOrders: (typeof ordersTable.$inferSelect)[] = [];

  for (const userId of userIds) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) continue;

    const id = crypto.randomUUID();
    const description = `Copy Trade: ${side === "buy" ? "BUY" : "SELL"} ${quantity} ${symbol} @ $${price.toFixed(2)}`;

    const [order] = await db.insert(ordersTable).values({
      id,
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      type: "copy_trade",
      description,
      amount,
      status: "confirmed",
    }).returning();

    const newBalance = side === "buy" ? user.balance - amount : user.balance + amount;
    await db.update(usersTable).set({ balance: newBalance }).where(eq(usersTable.id, user.id));

    sendOrderStatusEmail({
      email: user.email,
      firstName: user.firstName,
      type: "copy_trade",
      description,
      amount,
      status: "approved",
    }).catch(() => {});

    if (order) createdOrders.push(order);
  }

  req.log.info({ adminId: admin.id, count: createdOrders.length, symbol, side }, "Copy trade applied");

  res.status(201).json({ ordersCreated: createdOrders.length, orders: createdOrders });
});

export default router;
