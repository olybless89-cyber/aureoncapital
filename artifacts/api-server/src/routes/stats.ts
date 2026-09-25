import { Router, type IRouter } from "express";
import { gte } from "drizzle-orm";
import { db, usersTable, ordersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/stats/overview", requireAdmin, async (req, res): Promise<void> => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [userStats] = await db
    .select({
      totalUsers: sql<number>`count(*)::int`,
      newUsersThisWeek: sql<number>`count(*) filter (where ${usersTable.createdAt} >= ${oneWeekAgo})::int`,
      totalRevenue: sql<number>`coalesce(sum(${usersTable.balance}), 0)`,
    })
    .from(usersTable);

  const [orderStats] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      pendingOrders: sql<number>`count(*) filter (where ${ordersTable.status} = 'pending')::int`,
      totalInvested: sql<number>`coalesce(sum(${ordersTable.amount}) filter (where ${ordersTable.type} = 'investment'), 0)`,
      pendingTransactions: sql<number>`count(*) filter (where ${ordersTable.status} in ('pending', 'processing'))::int`,
      activeInvestments: sql<number>`count(*) filter (where ${ordersTable.type} = 'investment' and ${ordersTable.status} = 'confirmed')::int`,
    })
    .from(ordersTable);

  res.json({
    totalUsers: userStats?.totalUsers ?? 0,
    newUsersThisWeek: userStats?.newUsersThisWeek ?? 0,
    totalRevenue: userStats?.totalRevenue ?? 0,
    totalInvested: orderStats?.totalInvested ?? 0,
    pendingTransactions: orderStats?.pendingTransactions ?? 0,
    activeInvestments: orderStats?.activeInvestments ?? 0,
    totalOrders: orderStats?.totalOrders ?? 0,
    pendingOrders: orderStats?.pendingOrders ?? 0,
  });
});

export default router;
