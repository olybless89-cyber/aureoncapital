import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PendingApprovalGate } from "@/components/PendingApprovalGate";
import {
  LayoutDashboard,
  CreditCard,
  Gift,
  ShoppingBag,
  Hexagon,
  Settings,
  ShieldAlert,
  Repeat,
  Users,
  LogOut,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  LineChart,
  Car,
  Menu,
  X,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const logoutMutation = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-[100dvh] bg-background flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearToken();
        setLocation("/login");
      }
    });
  };

  const isAdmin = user.role === "admin";

  // Registration is free (no payment), but non-admin accounts still start
  // "pending" until an admin approves them from Admin > Users -- block the
  // entire app behind that review gate instead of gating each page
  // individually. (Previously this gate required a BTC membership fee via
  // MembershipGate; that payment requirement has been removed -- this is
  // now purely an admin-approval step.)
  if (!isAdmin && user.status === "pending") {
    return <PendingApprovalGate user={user} />;
  }

  const userLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/invest", label: "Invest", icon: TrendingUp },
    { href: "/deposit", label: "Deposit", icon: ArrowDownLeft },
    { href: "/withdraw", label: "Withdraw", icon: ArrowUpRight },
    { href: "/transactions", label: "Transactions", icon: ClipboardList },
    { href: "/markets", label: "Markets", icon: LineChart },
    { href: "/showroom", label: "Showroom", icon: Car },
    { href: "/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/entries", label: "Giveaway Entries", icon: Gift },
    { href: "/assets", label: "Digital Assets", icon: Hexagon },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin/overview", label: "Command Center", icon: ShieldAlert },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/transactions", label: "Transactions", icon: ClipboardList },
    { href: "/admin/orders", label: "All Orders", icon: ShoppingBag },
    { href: "/admin/copy-trade", label: "Copy Trading", icon: Repeat },
    { href: "/admin/email", label: "Email Center", icon: Mail },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center px-8 border-b border-border">
        <Link href="/dashboard" className="font-sans font-bold text-white hover:text-primary transition-colors cursor-pointer leading-tight block">
          <div className="text-[11px] tracking-[0.12em]">AUREON</div>
          <div className="text-[11px] tracking-[0.12em]">CAPITAL</div>
        </Link>
      </div>

      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-white/10 flex-shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-sm">{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium text-white text-sm truncate">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-primary font-medium tracking-wider uppercase mt-0.5">
              {isAdmin ? "Administrator" : "Premium Member"}
            </div>
          </div>
        </div>
        {!isAdmin && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Balance</span>
            <span className="text-emerald-400 font-mono font-semibold">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = location === link.href || location.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors cursor-pointer group relative",
                isActive
                  ? "text-white bg-white/5"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-md" />}
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-sm">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-white text-sm"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card/30 hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-5 h-14">
        <span className="font-bold tracking-[0.02em] text-[11px] text-white whitespace-nowrap">AUREON CAPITAL</span>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 bottom-0 w-64 bg-card border-r border-border flex flex-col" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background to-card/50 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
