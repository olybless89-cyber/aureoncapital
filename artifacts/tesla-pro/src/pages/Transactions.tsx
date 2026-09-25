import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

const TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  merchandise: "Car Purchase",
  giveaway: "Giveaway Entry",
  digital: "Digital Asset",
};

const TYPE_ICONS: Record<string, string> = {
  deposit: "↓",
  withdrawal: "↑",
  investment: "📈",
  merchandise: "🚗",
  giveaway: "🎁",
  digital: "💎",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(234,179,8,0.15)", color: "#eab308" },
  confirmed: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  processing: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  delivered: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  cancelled: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

export default function TransactionsPage() {
  const { data: user } = useGetMe();
  const { data: allOrders, isLoading } = useListOrders({ userId: user?.id });
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal" | "investment" | "merchandise">("all");
  const [, navigate] = useLocation();

  const filtered = (allOrders || []).filter(o => {
    if (filter === "all") return true;
    return o.type === filter;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalIn = (allOrders || []).filter(o => o.type === "deposit" && o.status === "confirmed").reduce((s, o) => s + o.amount, 0);
  const totalOut = (allOrders || []).filter(o => o.type === "withdrawal" && o.status === "confirmed").reduce((s, o) => s + o.amount, 0);

  return (
    <AppLayout>
      <div style={{ padding: "40px", maxWidth: 900, margin: "0 auto", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>History</p>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px" }}>Transactions</h1>
          <p style={{ color: "#8b95a1", fontSize: 14 }}>All your deposits, withdrawals, investments, and purchases.</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Current Balance", value: `$${(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#22c55e", icon: "💰" },
            { label: "Total Deposited", value: `$${totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#3b82f6", icon: "↓" },
            { label: "Total Withdrawn", value: `$${totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#f97316", icon: "↑" },
          ].map(c => (
            <div key={c.label} style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 10, padding: "20px" }}>
              <div style={{ fontSize: 11, color: "#8b95a1", letterSpacing: "0.1em", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <button onClick={() => navigate("/deposit")} style={{ padding: "10px 20px", background: "#22c55e", border: "none", color: "#fff", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + Deposit
          </button>
          <button onClick={() => navigate("/withdraw")} style={{ padding: "10px 20px", background: "transparent", border: "1px solid #e31937", color: "#e31937", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ↑ Withdraw
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[["all", "All"], ["deposit", "Deposits"], ["withdrawal", "Withdrawals"], ["investment", "Investments"], ["merchandise", "Car Orders"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k as any)} style={{
              padding: "7px 14px", borderRadius: 20,
              background: filter === k ? "#e31937" : "#0d1520",
              border: `1px solid ${filter === k ? "#e31937" : "#1a2332"}`,
              color: filter === k ? "#fff" : "#8b95a1", fontSize: 12, cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 10, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#8b95a1" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#8b95a1" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              No transactions yet.
            </div>
          ) : (
            <div>
              {filtered.map(tx => {
                const sc = STATUS_COLORS[tx.status] || { bg: "rgba(139,149,161,0.1)", color: "#8b95a1" };
                const isInflow = tx.type === "deposit";
                const isOutflow = ["withdrawal", "merchandise", "investment"].includes(tx.type);
                return (
                  <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #1a2332" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: isInflow ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                    }}>
                      {TYPE_ICONS[tx.type] || "•"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#e8eaec", fontWeight: 500, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {TYPE_LABELS[tx.type] || tx.type}
                      </div>
                      <div style={{ color: "#8b95a1", fontSize: 12, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {tx.description}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: isInflow ? "#22c55e" : isOutflow ? "#e8eaec" : "#e8eaec" }}>
                        {isInflow ? "+" : isOutflow ? "-" : ""}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 11, color: "#8b95a1", marginTop: 2 }}>{format(new Date(tx.createdAt), "MMM dd, yyyy")}</div>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                      {tx.status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
