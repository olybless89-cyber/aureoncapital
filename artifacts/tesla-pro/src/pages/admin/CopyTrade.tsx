import { useState } from "react";
import { useListUsers, useListOrders, useCreateCopyTrade, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Loader2, Repeat } from "lucide-react";
import { STOCKS } from "@/lib/stocks";
import { StockLogo } from "@/components/StockLogo";

export default function AdminCopyTrade() {
  const { data: users, isLoading: usersLoading } = useListUsers({ status: "active" });
  const { data: orders, isLoading: ordersLoading } = useListOrders();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const copyTrade = useCreateCopyTrade();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [symbol, setSymbol] = useState<string>(STOCKS[0].symbol);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number>(STOCKS[0].price);

  const nonAdminUsers = (users || []).filter(u => u.role !== "admin");
  const copyTradeOrders = (orders || [])
    .filter(o => o.type === "copy_trade")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedUserIds(prev => prev.length === nonAdminUsers.length ? [] : nonAdminUsers.map(u => u.id));
  };

  const handleSymbolChange = (sym: string) => {
    setSymbol(sym);
    const stock = STOCKS.find(s => s.symbol === sym);
    if (stock) setPrice(stock.price);
  };

  const handleApply = () => {
    if (selectedUserIds.length === 0) {
      toast({ title: "Select at least one user", variant: "destructive" });
      return;
    }
    copyTrade.mutate({
      data: { userIds: selectedUserIds, symbol, side, quantity: Number(quantity), price: Number(price) }
    }, {
      onSuccess: (res) => {
        toast({ title: "Copy trade applied", description: `Mirrored to ${res.ordersCreated} account(s).` });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setSelectedUserIds([]);
      },
      onError: (err: any) => {
        toast({ title: "Copy Trade Failed", description: err?.data?.message || err?.message, variant: "destructive" });
      }
    });
  };

  const total = Number(quantity || 0) * Number(price || 0);

  if (usersLoading || ordersLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  return (
    <AppLayout>
      <div className="p-6 md:p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2 text-white flex items-center gap-3">
            <Repeat className="h-7 w-7 text-primary" /> Copy Trading
          </h1>
          <p className="text-muted-foreground">Mirror a simulated trade directly into one or more member accounts. Applied immediately — no approval step.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass border-white/5">
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-medium text-white">Trade Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Symbol</Label>
                  <Select value={symbol} onValueChange={handleSymbolChange}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-white">
                      {STOCKS.map(s => (
                        <SelectItem key={s.symbol} value={s.symbol}>
                          <span className="flex items-center gap-2">
                            <StockLogo symbol={s.symbol} logoDomain={s.logoDomain} size={20} fallbackFontSize={9} />
                            {s.symbol} — {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Side</Label>
                  <Select value={side} onValueChange={v => setSide(v as "buy" | "sell")}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-white">
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Quantity (shares)</Label>
                  <Input
                    type="number" min={1} value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Price per share (USD)</Label>
                  <Input
                    type="number" step="0.01" value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-black/20 rounded-md px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {side === "buy" ? "Deducted from" : "Credited to"} each selected user's balance
                </span>
                <span className="text-xl font-semibold text-primary">
                  ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Apply to users ({selectedUserIds.length} selected)</Label>
                  <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={toggleAll}>
                    {selectedUserIds.length === nonAdminUsers.length ? "Clear all" : "Select all"}
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto border border-white/10 rounded-md divide-y divide-white/5">
                  {nonAdminUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5">
                      <Checkbox checked={selectedUserIds.includes(u.id)} onCheckedChange={() => toggleUser(u.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white truncate">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </label>
                  ))}
                  {nonAdminUsers.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground p-4">No active users found.</div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleApply}
                disabled={copyTrade.isPending || selectedUserIds.length === 0}
                className="w-full bg-primary hover:bg-primary/90 text-white signal-glow"
              >
                {copyTrade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Copy Trade to {selectedUserIds.length || 0} User{selectedUserIds.length === 1 ? "" : "s"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass border-white/5">
            <CardContent className="p-0">
              <div className="p-6 pb-2">
                <h2 className="text-lg font-medium text-white">Recent Copy Trades</h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead>User</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {copyTradeOrders.slice(0, 25).map(o => (
                      <TableRow key={o.id} className="border-white/5 hover:bg-white/5">
                        <TableCell>
                          <div className="text-white text-sm">{o.userName}</div>
                          <div className="text-xs text-muted-foreground">{o.userEmail}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{o.description}</TableCell>
                        <TableCell className="font-mono text-white">${o.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(o.createdAt), "MMM dd, HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                    {copyTradeOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">
                          No copy trades applied yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
