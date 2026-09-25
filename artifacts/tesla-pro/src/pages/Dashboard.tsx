import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { DollarSign, Gift, Star, Users, ArrowRight, ShoppingBag, TrendingUp, ArrowUpRight, ArrowDownLeft, LineChart } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

const TYPE_ICONS: Record<string, any> = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  investment: TrendingUp,
  merchandise: LineChart,
  giveaway: Gift,
};
const TYPE_COLORS: Record<string, string> = {
  deposit: "#22c55e",
  withdrawal: "#ef4444",
  investment: "#3b82f6",
  merchandise: "#a855f7",
  giveaway: "#f59e0b",
};

export default function DashboardPage() {
  const { data: user } = useGetMe();
  const { data: orders } = useListOrders({ userId: user?.id });
  const [, navigate] = useLocation();

  if (!user) return null;

  const activeInvestments = (orders || []).filter(o => o.type === "investment");
  const pendingDeposits = (orders || []).filter(o => o.type === "deposit" && o.status === "pending");
  const recentOrders = [...(orders || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-tight mb-2 text-white">
              Welcome back, <span className="font-medium">{user.firstName}</span>
            </h1>
            <p className="text-muted-foreground">Your premium ecosystem overview.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => navigate("/deposit")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-sm h-10 px-6 text-sm tracking-wide">
              + Deposit
            </Button>
            <Button onClick={() => navigate("/withdraw")} variant="outline" className="border-white/10 hover:bg-white/5 text-white rounded-sm h-10 px-6 text-sm">
              Withdraw
            </Button>
            <Button onClick={() => navigate("/markets")} className="bg-primary hover:bg-primary/90 text-white tracking-[0.08em] uppercase font-medium rounded-sm h-10 px-6 text-sm signal-glow">
              Markets
            </Button>
          </div>
        </div>

        {/* Pending deposits alert */}
        {pendingDeposits.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-yellow-500 text-lg">⏳</div>
              <div>
                <div className="text-yellow-400 font-medium text-sm">{pendingDeposits.length} pending deposit{pendingDeposits.length > 1 ? "s" : ""} awaiting approval</div>
                <div className="text-yellow-600 text-xs mt-0.5">Total: ${pendingDeposits.reduce((s, o) => s + o.amount, 0).toLocaleString()}</div>
              </div>
            </div>
            <Button onClick={() => navigate("/transactions")} variant="ghost" className="text-yellow-400 hover:text-yellow-300 text-xs px-3">View →</Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Available Balance"
            value={`$${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon={<DollarSign className="text-emerald-500" />}
          />
          <StatCard
            title="Active Investments"
            value={activeInvestments.length}
            icon={<TrendingUp className="text-blue-400" />}
          />
          <StatCard
            title="Reward Points"
            value={user.rewardPoints.toLocaleString()}
            icon={<Star className="text-primary" />}
          />
          <StatCard
            title="Referrals"
            value={user.referralCount}
            icon={<Users className="text-primary" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Digital Identity Card */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Digital Identity</h3>
            <Card className="glass overflow-hidden border-white/10 relative group aspect-[1.58/1]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent z-0" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
              <CardContent className="p-6 md:p-8 flex flex-col h-full justify-between relative z-10">
                <div className="flex justify-between items-start">
                  <div className="font-sans font-bold tracking-[0.1em] text-xs text-white">AUREON CAPITAL</div>
                  <div className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest rounded-sm border border-primary/20">
                    Premium
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Member Code</div>
                  <div className="font-mono text-lg text-white tracking-widest opacity-80 mb-6">{user.memberCode || "ST-0000-0000"}</div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium border border-white/20">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-muted-foreground">Joined {format(new Date(user.createdAt), "yyyy")}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button onClick={() => navigate("/invest")} variant="outline" className="border-white/10 hover:bg-white/5 text-white text-xs h-10 rounded-sm">
                📈 Invest
              </Button>
              <Button onClick={() => navigate("/transactions")} variant="outline" className="border-white/10 hover:bg-white/5 text-white text-xs h-10 rounded-sm">
                📋 History
              </Button>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Investment */}
            {activeInvestments.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Active Investments</h3>
                <div className="space-y-3">
                  {activeInvestments.slice(0, 2).map(inv => (
                    <Card key={inv.id} className="glass border-white/10 p-4 md:p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-primary text-xs font-bold uppercase tracking-widest mb-1">{inv.type}</div>
                          <div className="text-white font-medium truncate">{inv.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">{format(new Date(inv.createdAt), "MMM dd, yyyy")}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-bold text-white">${inv.amount.toLocaleString()}</div>
                          <StatusBadge status={inv.status} />
                        </div>
                      </div>
                    </Card>
                  ))}
                  {activeInvestments.length > 2 && (
                    <Button onClick={() => navigate("/transactions")} variant="link" className="text-primary p-0 h-auto font-normal text-xs">
                      View all {activeInvestments.length} investments →
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Giveaway Draw</h3>
                <Card className="glass border-white/10 p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none" />
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <div className="text-primary text-sm font-bold uppercase tracking-widest mb-1">Draw #42</div>
                        <h4 className="text-2xl font-light text-white mb-2">Grand Cash Giveaway — $75,000</h4>
                        <p className="text-muted-foreground text-sm">You currently have 5 entries. Draw closes Dec 31, 2026.</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Entry Progress</span>
                          <span className="text-white font-medium">5 / 10</span>
                        </div>
                        <Progress value={50} className="h-2 bg-white/5" />
                      </div>
                      <Button onClick={() => navigate("/invest")} variant="outline" className="border-primary text-primary hover:bg-primary/10 tracking-[0.08em] uppercase font-medium rounded-sm w-full sm:w-auto text-xs">
                        Get More Entries via Investment
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Recent Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Recent Activity</h3>
                <Button onClick={() => navigate("/transactions")} variant="link" className="text-primary p-0 h-auto font-normal hover:no-underline hover:text-primary/80 text-xs">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <Card className="glass border-white/10">
                <CardContent className="p-0">
                  {recentOrders.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {recentOrders.map(order => {
                        const Icon = TYPE_ICONS[order.type] || ShoppingBag;
                        const iconColor = TYPE_COLORS[order.type] || "#8b95a1";
                        return (
                          <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 flex-shrink-0">
                                <Icon style={{ color: iconColor }} className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-white font-medium text-sm truncate">{order.description}</div>
                                <div className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "MMM dd, yyyy")}</div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                              <div className="font-mono text-white text-sm">${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <div className="text-3xl mb-3">📭</div>
                      No activity yet. Start by depositing or investing.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
