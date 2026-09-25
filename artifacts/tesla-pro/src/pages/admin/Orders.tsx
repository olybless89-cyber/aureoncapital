import { useState } from "react";
import { useListOrders, useUpdateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Loader2, Edit2 } from "lucide-react";

export default function AdminOrders() {
  const { data: orders, isLoading } = useListOrders();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [status, setStatus] = useState<any>("");
  
  const updateOrder = useUpdateOrder();

  const filteredOrders = orders?.filter(o => 
    o.userEmail.toLowerCase().includes(search.toLowerCase()) || 
    o.userName.toLowerCase().includes(search.toLowerCase()) || 
    o.description.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setStatus(order.status);
  };

  const handleSave = () => {
    if (!editingOrder) return;
    
    updateOrder.mutate({
      orderId: editingOrder.id,
      data: { status }
    }, {
      onSuccess: () => {
        toast({ title: "Order Updated", description: "Order status has been saved." });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setEditingOrder(null);
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err?.data?.message || err?.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <AppLayout><LoadingSpinner /></AppLayout>;

  return (
    <AppLayout>
      <div className="p-6 md:p-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-tight mb-2 text-white">Orders Management</h1>
            <p className="text-muted-foreground">Manage investments, merchandise, and giveaways.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search orders..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary"
            />
          </div>
        </div>

        <Card className="glass border-white/5">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead>Order ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {order.id.split('-')[0]}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{order.userName}</div>
                        <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                      </TableCell>
                      <TableCell className="capitalize">{order.type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-white">{order.description}</TableCell>
                      <TableCell className="font-mono text-white">${order.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(order)} className="hover:text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center p-8 text-muted-foreground">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
          <DialogContent className="glass border-white/10 bg-card">
            <DialogHeader>
              <DialogTitle className="text-white">Update Order Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-white">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white" onClick={() => setEditingOrder(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateOrder.isPending} className="bg-primary hover:bg-primary/90 text-white signal-glow">
                {updateOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
