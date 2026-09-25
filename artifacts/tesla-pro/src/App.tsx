import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';

import LandingPage from '@/pages/Landing';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import DashboardPage from '@/pages/Dashboard';
import MarketsPage from '@/pages/Markets';
import ShowroomPage from '@/pages/Showroom';
import InvestPage from '@/pages/Invest';
import DepositPage from '@/pages/Deposit';
import WithdrawPage from '@/pages/Withdraw';
import TransactionsPage from '@/pages/Transactions';
import AdminOverview from '@/pages/admin/Overview';
import AdminUsers from '@/pages/admin/Users';
import AdminOrders from '@/pages/admin/Orders';
import AdminTransactions from '@/pages/admin/Transactions';
import AdminCopyTrade from '@/pages/admin/CopyTrade';
import AdminEmail from '@/pages/admin/Email';
import ChangePasswordPage from '@/pages/ChangePassword';
import OrdersPage from '@/pages/Orders';
import GiveawayEntriesPage from '@/pages/GiveawayEntries';
import DigitalAssetsPage from '@/pages/DigitalAssets';
import SettingsPage from '@/pages/Settings';

// Global safety net: any mutation whose page doesn't already have its own
// onError handler (or whose handler fails to surface the real message —
// several pages here were reading err.response?.data?.message, an
// axios-style shape this app's fetch client doesn't use, so real errors
// were silently swallowed) now falls back to a visible toast automatically.
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error?.data?.message || error?.message || 'Something went wrong. Please try again.',
      });
    },
  }),
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/markets" component={MarketsPage} />
      <Route path="/showroom" component={ShowroomPage} />
      <Route path="/invest" component={InvestPage} />
      <Route path="/deposit" component={DepositPage} />
      <Route path="/withdraw" component={WithdrawPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/change-password" component={ChangePasswordPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/entries" component={GiveawayEntriesPage} />
      <Route path="/assets" component={DigitalAssetsPage} />
      <Route path="/settings" component={SettingsPage} />
      {/* Admin */}
      <Route path="/admin/overview" component={AdminOverview} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/copy-trade" component={AdminCopyTrade} />
      <Route path="/admin/email" component={AdminEmail} />
      <Route path="/admin/settings" component={SettingsPage} />
      {/* Public */}
      <Route path="/" component={LandingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
