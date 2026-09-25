import { useState } from "react";
import { useListOrders, useUpdateOrder, useUpdateUser, useListUsers, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { Search, Check, X, Loader2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  merchandise: "Car Purchase",
  giveaway: "Giveaway",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(234,179,8,0.15)", color: "#eab308" },
  confirmed: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  processing: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  cancelled: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

export default function AdminTransactions() {
  const { data: orders, isLoading } = useListOrders();
  const { data: users } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateOrder = useUpdateOrder();
  const updateUser = useUpdateUser();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const filtered = (orders || [])
    .filter(o => ["deposit", "withdrawal", "investment", "merchandise"].includes(o.type))
    .filter(o => typeFilter === "all" || o.type === typeFilter)
    .filter(o => !search || o.userEmail.toLowerCase().includes(search.toLowerCase()) || o.userName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleApprove = async (order: any) => {
    setProcessing(order.id);
    try {
      // Update order status to confirmed
      await new Promise<void>((resolve, reject) => {
        updateOrder.mutate({ orderId: order.id, data: { status: "confirmed" } }, {
          onSuccess: () => resolve(),
          onError: reject,
        });
      });

      // Adjust user balance for deposits/withdrawals
      const user = users?.find(u => u.id === order.userId);
      if (user) {
        if (order.type === "deposit") {
          await new Promise<void>((resolve, reject) => {
            updateUser.mutate({ userId: user.id, data: { balance: user.balance + order.amount } }, {
              onSuccess: () => resolve(),
              onError: reject,
            });
          });
        } else if (order.type === "withdrawal") {
          const newBal = Math.max(0, user.balance - order.amount);
          await new Promise<void>((resolve, reject) => {
            updateUser.mutate({ userId: user.id, data: { balance: newBal } }, {
              onSuccess: () => resolve(),
              onError: reject,
            });
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      toast({ title: "Approved", description: `${TYPE_LABELS[order.type] || order.type} confirmed and balance updated.` });
    } catch {
      toast({ title: "Error", description: "Failed to process.", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (order: any) => {
    setProcessing(order.id);
    updateOrder.mutate({ orderId: order.id, data: { status: "cancelled" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Rejected", description: "Order cancelled." });
        setProcessing(null);
      },
      onError: () => { setProcessing(null); },
    });
  };

  const pendingCount = filtered.filter(o => o.status === "pending").length;

  return (
    <AppLayout>
      <div style={{ padding: "40px", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px" }}>
              Transactions
              {pendingCount > 0 && <span style={{ marginLeft: 12, background: "#e31937", color: "#fff", fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 700, verticalAlign: "middle" }}>{pendingCount} Pending</span>}
            </h1>
            <p style={{ color: "#8b95a1", margin: 0, fontSize: 14 }}>Manage deposits, withdrawals, investments, and car orders.</p>
          </div>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#8b95a1" }} />
            <input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: "#0d1520", border: "1px solid #1a2332", borderRadius: 6, color: "#e8eaec", fontSize: 13, outline: "none", width: 220 }}
            />
          </div>
        </div>

        {/* Type filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[["all", "All"], ["deposit", "Deposits"], ["withdrawal", "Withdrawals"], ["investment", "Investments"], ["merchandise", "Car Orders"]].map(([k, l]) => (
            <button key={k} onClick={() => setTypeFilter(k)} style={{
              padding: "7px 14px", borderRadius: 20,
              background: typeFilter === k ? "#e31937" : "#0d1520",
              border: `1px solid ${typeFilter === k ? "#e31937" : "#1a2332"}`,
              color: typeFilter === k ? "#fff" : "#8b95a1", fontSize: 12, cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>

        <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 10, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#8b95a1" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#8b95a1" }}>No records found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a2332" }}>
                    {["Date", "User", "Type", "Description", "Amount", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#8b95a1", fontWeight: 500, letterSpacing: "0.05em", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(order => {
                    const sc = STATUS_COLORS[order.status] || { bg: "rgba(139,149,161,0.1)", color: "#8b95a1" };
                    return (
                      <tr key={order.id} style={{ borderBottom: "1px solid #1a2332" }}>
                        <td style={{ padding: "14px 16px", color: "#8b95a1", whiteSpace: "nowrap" }}>{format(new Date(order.createdAt), "MMM dd, yyyy")}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontWeight: 500, color: "#e8eaec" }}>{order.userName}</div>
                          <div style={{ fontSize: 11, color: "#8b95a1" }}>{order.userEmail}</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, background: "#1a2332", color: "#c0c8d4" }}>{TYPE_LABELS[order.type] || order.type}</span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#8b95a1", maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.description}</div>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: order.type === "deposit" ? "#22c55e" : "#e8eaec", whiteSpace: "nowrap" }}>
                          {order.type === "deposit" ? "+" : order.type === "withdrawal" ? "−" : ""}${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{order.status.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {order.status === "pending" ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              {processing === order.id ? (
                                <Loader2 style={{ width: 18, height: 18, color: "#8b95a1", animation: "spin 1s linear infinite" }} />
                              ) : (
                                <>
                                  <button onClick={() => handleApprove(order)} style={{ width: 30, height: 30, borderRadius: 6, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Check style={{ width: 14, height: 14 }} />
                                  </button>
                                  <button onClick={() => handleReject(order)} style={{ width: 30, height: 30, borderRadius: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <X style={{ width: 14, height: 14 }} />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "#3a4552" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
