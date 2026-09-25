import { useListOrders, useGetMe, useCreateOrder, type Order } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#1a2a1a", color: "#f59e0b" },
  confirmed:  { bg: "#1a2a1a", color: "#22c55e" },
  processing: { bg: "#1a2332", color: "#60a5fa" },
  delivered:  { bg: "#1a2a1a", color: "#22c55e" },
  cancelled:  { bg: "#2a1a1a", color: "#ef4444" },
};

const TYPE_LABEL: Record<string, string> = {
  purchase:        "Purchase",
  investment:      "Investment",
  deposit:         "Deposit",
  withdrawal:      "Withdrawal",
  copy_trade:      "Copy Trade",
  membership_fee:  "Membership Fee",
};

// Tesla Showroom installment plans have no dedicated backend table — each
// plan is reconstructed from its orders' `description` text, which is
// written in a fixed, parseable shape (see Showroom.tsx's PurchaseModal
// for the down-payment order, and the "Pay Next Installment" handler
// below for each part). The down-payment order IS installment 1 of N; its
// own `amount` field is the exact down-payment amount (no need to parse
// that out of the string).
const DOWN_PAYMENT_RE = /^(.+?) — Color: .+ — Via: .+ — Installment Plan: down payment \(1 of (\d+)\) — Total \$([\d,]+(?:\.\d+)?), then (\d+) monthly payments of \$([\d,]+(?:\.\d+)?)$/;
const INSTALLMENT_PART_RE = /^(.+?) — Installment payment \((\d+) of (\d+)\) for plan ([0-9a-fA-F-]{36}) — \$([\d,]+(?:\.\d+)?)$/;

function parseMoney(s: string) {
  return Number(s.replace(/,/g, ""));
}

interface InstallmentPlan {
  rootOrderId: string;
  model: string;
  total: number;
  months: number;
  perMonth: number;
  downAmount: number;
  rootStatus: string;
  rootCreatedAt: string;
  parts: { n: number; status: string; amount: number }[];
}

function buildInstallmentPlans(orders: Order[]): InstallmentPlan[] {
  const plans: InstallmentPlan[] = [];
  for (const o of orders) {
    const m = DOWN_PAYMENT_RE.exec(o.description);
    if (!m) continue;
    plans.push({
      rootOrderId: o.id,
      model: m[1],
      total: parseMoney(m[3]),
      months: Number(m[4]),
      perMonth: parseMoney(m[5]),
      downAmount: o.amount,
      rootStatus: o.status,
      rootCreatedAt: o.createdAt,
      parts: [],
    });
  }
  for (const o of orders) {
    const m = INSTALLMENT_PART_RE.exec(o.description);
    if (!m) continue;
    const plan = plans.find(p => p.rootOrderId === m[4]);
    if (plan) plan.parts.push({ n: Number(m[2]), status: o.status, amount: parseMoney(m[5]) });
  }
  for (const p of plans) p.parts.sort((a, b) => a.n - b.n);
  return plans;
}

function InstallmentPlanCard({ plan }: { plan: InstallmentPlan }) {
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const totalInstallments = plan.months + 1; // down payment counts as #1
  const submittedCount = 1 + plan.parts.length;
  const latestStatus = plan.parts.length > 0 ? plan.parts[plan.parts.length - 1].status : plan.rootStatus;
  const isComplete = submittedCount >= totalInstallments && latestStatus === "confirmed";
  const canPayNext = !isComplete && latestStatus === "confirmed" && submittedCount < totalInstallments;
  const nextN = submittedCount + 1;
  const isLastInstallment = nextN === totalInstallments;
  const remainingAfterDown = Math.round((plan.total - plan.downAmount) * 100) / 100;
  const alreadyPaidInParts = Math.round(plan.perMonth * (nextN - 2) * 100) / 100;
  const nextAmount = isLastInstallment
    ? Math.round((remainingAfterDown - alreadyPaidInParts) * 100) / 100
    : plan.perMonth;

  const handlePayNext = () => {
    createOrder.mutate({
      data: {
        type: "purchase",
        description: `${plan.model} — Installment payment (${nextN} of ${totalInstallments}) for plan ${plan.rootOrderId} — $${nextAmount.toLocaleString()}`,
        amount: nextAmount,
      },
    }, {
      onError: (err: any) => {
        toast({ title: "Couldn't submit payment", description: err?.data?.message || err?.message || "Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, padding: "20px 24px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "#e31937", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Installment Plan</div>
          <div style={{ fontSize: 17, color: "#e8eaec", fontWeight: 600 }}>{plan.model}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#8b95a1" }}>Total price</div>
          <div style={{ fontSize: 16, color: "#e8eaec", fontWeight: 700 }}>${plan.total.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 6, background: "#1a2332", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(100, (submittedCount / totalInstallments) * 100)}%`, height: "100%",
            background: isComplete ? "#22c55e" : "#e31937",
          }} />
        </div>
        <span style={{ fontSize: 12, color: "#8b95a1", whiteSpace: "nowrap" }}>{submittedCount} of {totalInstallments} paid</span>
      </div>

      {isComplete ? (
        <div style={{ fontSize: 13, color: "#22c55e" }}>✓ Plan paid in full — your {plan.model} is being prepared for delivery.</div>
      ) : canPayNext ? (
        <button
          onClick={handlePayNext}
          disabled={createOrder.isPending}
          style={{
            padding: "10px 20px", background: "#e31937", border: "none", color: "#fff",
            borderRadius: 4, fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
            cursor: "pointer", opacity: createOrder.isPending ? 0.7 : 1,
          }}
        >
          {createOrder.isPending ? "Submitting…" : `Pay Installment ${nextN}/${totalInstallments} — $${nextAmount.toLocaleString()}`}
        </button>
      ) : (
        <div style={{ fontSize: 13, color: "#f59e0b" }}>
          ⏳ Awaiting admin confirmation of installment {submittedCount}/{totalInstallments} before the next payment can be submitted.
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { data: user } = useGetMe();
  // Scoped to the logged-in user server-side — without a userId filter this
  // endpoint returns every user's orders (see GET /orders in routes/orders.ts),
  // which "My Orders" was previously fetching in full and only narrowing down
  // client-side by a stale list of order types that no longer exist, so real
  // orders (purchases, deposits, copy trades, membership fees) never showed.
  const { data: orders, isLoading, isError } = useListOrders({ userId: user?.id });

  const myOrders = (orders ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const installmentPlans = buildInstallmentPlans(myOrders)
    .sort((a, b) => new Date(b.rootCreatedAt).getTime() - new Date(a.rootCreatedAt).getTime());

  return (
    <AppLayout>
      <div style={{ padding: "40px", maxWidth: 900, margin: "0 auto", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Account</p>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px" }}>My Orders</h1>
          <p style={{ color: "#8b95a1", fontSize: 14 }}>All your stock trades, digital assets, giveaway entries, and investments.</p>
        </div>

        {installmentPlans.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            {installmentPlans.map(p => <InstallmentPlanCard key={p.rootOrderId} plan={p} />)}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: "center", padding: 80, color: "#8b95a1" }}>Loading orders…</div>
        )}

        {isError && (
          <div style={{ textAlign: "center", padding: 80, color: "#ef4444" }}>Failed to load orders. Please refresh.</div>
        )}

        {!isLoading && !isError && myOrders.length === 0 && (
          <div style={{ textAlign: "center", padding: 80, background: "#0d1520", borderRadius: 12, border: "1px solid #1a2332" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
            <p style={{ color: "#8b95a1", fontSize: 15, marginBottom: 8 }}>No orders yet</p>
            <p style={{ color: "#4a5568", fontSize: 13 }}>Visit the Markets or Digital Assets to place your first order.</p>
          </div>
        )}

        {!isLoading && !isError && myOrders.length > 0 && (
          <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a2332" }}>
                  {["Date", "Type", "Description", "Amount", "Status"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontSize: 11, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myOrders.map((o, i) => {
                  const sc = STATUS_STYLE[o.status] ?? { bg: "#1a2332", color: "#c0c8d4" };
                  return (
                    <tr key={o.id} style={{ borderBottom: i < myOrders.length - 1 ? "1px solid #0f1824" : "none" }}>
                      <td style={{ padding: "14px 16px", color: "#8b95a1", fontSize: 13, whiteSpace: "nowrap" }}>
                        {new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, background: "#1a2332", color: "#c0c8d4" }}>
                          {TYPE_LABEL[o.type] ?? o.type}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#8b95a1", maxWidth: 260, fontSize: 13 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.description}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>
                        ${o.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
