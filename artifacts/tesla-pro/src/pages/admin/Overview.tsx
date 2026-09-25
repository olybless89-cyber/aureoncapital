import { useGetStatsOverview } from "@workspace/api-client-react";
import { StatCard } from "@/components/StatCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AppLayout } from "@/components/AppLayout";
import { Users, DollarSign, Clock, TrendingUp, ShoppingCart, Activity } from "lucide-react";

export default function AdminOverview() {
  const { data: stats, isLoading } = useGetStatsOverview();

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  return (
    <AppLayout>
      <div className="p-6 md:p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2 text-white">Command Center</h1>
          <p className="text-muted-foreground">Platform-wide statistics and metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Users" 
            value={stats?.totalUsers ?? 0} 
            icon={<Users className="text-primary" />} 
            description={`+${stats?.newUsersThisWeek ?? 0} this week`}
            className="border-white/5"
          />
          <StatCard 
            title="Total Revenue" 
            value={`${stats?.totalRevenue?.toLocaleString() ?? 0}`} 
            icon={<DollarSign className="text-primary" />} 
            className="border-white/5"
          />
          <StatCard 
            title="Total Invested" 
            value={`${stats?.totalInvested?.toLocaleString() ?? 0}`} 
            icon={<TrendingUp className="text-primary" />} 
            className="border-white/5"
          />
          <StatCard 
            title="Pending TXs" 
            value={stats?.pendingTransactions ?? 0} 
            icon={<Clock className="text-yellow-500" />} 
            className={stats?.pendingTransactions ? "border-yellow-500/30" : "border-white/5"}
          />
          <StatCard 
            title="Active Investments" 
            value={stats?.activeInvestments ?? 0} 
            icon={<Activity className="text-primary" />} 
            className="border-white/5"
          />
          <StatCard 
            title="Total Orders" 
            value={stats?.totalOrders ?? 0} 
            icon={<ShoppingCart className="text-primary" />} 
            className="border-white/5"
          />
          <StatCard 
            title="Pending Orders" 
            value={stats?.pendingOrders ?? 0} 
            icon={<Clock className="text-yellow-500" />} 
            className={stats?.pendingOrders ? "border-yellow-500/30" : "border-white/5"}
          />
        </div>
      </div>
    </AppLayout>
  );
}
