import { useState } from "react";
import { useListUsers, useUpdateUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Loader2, Edit2, CheckCircle2 } from "lucide-react";

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  const updateUser = useUpdateUser();

  const filteredUsers = users?.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.firstName.toLowerCase().includes(search.toLowerCase()) || 
    u.lastName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      role: user.role,
      status: user.status,
      balance: user.balance
    });
  };

  const handleApprove = (user: any) => {
    updateUser.mutate({
      userId: user.id,
      data: { status: "active" }
    }, {
      onSuccess: () => {
        toast({ title: "User Approved", description: `${user.firstName} ${user.lastName} now has dashboard access.` });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Approval Failed", description: err?.data?.message || err?.message, variant: "destructive" });
      }
    });
  };

  const handleSave = () => {
    if (!editingUser) return;
    
    updateUser.mutate({
      userId: editingUser.id,
      data: {
        role: formData.role,
        status: formData.status,
        balance: Number(formData.balance)
      }
    }, {
      onSuccess: () => {
        toast({ title: "User Updated", description: "User details have been saved." });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setEditingUser(null);
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
            <h1 className="text-3xl font-light tracking-tight mb-2 text-white">User Management</h1>
            <p className="text-muted-foreground">Manage members, balances, and permissions.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
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
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <div className="font-medium text-white">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell className="capitalize text-white">{user.role}</TableCell>
                      <TableCell><StatusBadge status={user.status} /></TableCell>
                      <TableCell className="font-mono text-white">${user.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(user)}
                              disabled={updateUser.isPending}
                              className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="hover:text-primary">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="glass border-white/10 bg-card">
            <DialogHeader>
              <DialogTitle className="text-white">Edit User: {editingUser?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-white">Role</Label>
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Wallet Balance (USD)</Label>
                <Input 
                  type="number" 
                  value={formData.balance} 
                  onChange={e => setFormData({...formData, balance: e.target.value})}
                  className="bg-black/20 border-white/10 focus-visible:ring-primary text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateUser.isPending} className="bg-primary hover:bg-primary/90 text-white signal-glow">
                {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
