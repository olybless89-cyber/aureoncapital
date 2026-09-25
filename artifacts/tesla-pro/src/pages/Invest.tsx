import { AppLayout } from "@/components/AppLayout";
import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Fixed, deterministic illustrative data — purely decorative, not tied to any
// real account or market feed. Do not replace with Math.random() or live data.
const GROWTH_CHART_DATA = [
  { month: "Jan", value: 10200 },
  { month: "Feb", value: 10850 },
  { month: "Mar", value: 10600 },
  { month: "Apr", value: 11400 },
  { month: "May", value: 12100 },
  { month: "Jun", value: 11950 },
  { month: "Jul", value: 12800 },
  { month: "Aug", value: 13500 },
  { month: "Sep", value: 13200 },
  { month: "Oct", value: 14100 },
  { month: "Nov", value: 14950 },
  { month: "Dec", value: 15800 },
];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    amount: 5_000,
    monthly: "5%",
    term: "12 months",
    totalReturn: "60%",
    perks: ["Giveaway entries", "Reward points", "Member card", "Community access"],
    highlight: false,
    color: "#0d1a2e",
    border: "#1e2d3d",
  },
  {
    id: "growth",
    name: "Growth",
    amount: 8_500,
    monthly: "7%",
    term: "12 months",
    totalReturn: "84%",
    perks: ["All Starter perks", "Priority support", "Digital assets access", "2× reward multiplier"],
    highlight: true,
    color: "#0f1d2f",
    border: "#1e3a5f",
  },
  {
    id: "elite",
    name: "Elite",
    amount: 15_000,
    monthly: "10%",
    term: "12 months",
    totalReturn: "120%",
    perks: ["All Growth perks", "VIP events", "Dedicated advisor", "5× reward multiplier", "Early car access"],
    highlight: false,
    color: "#0d1520",
    border: "#2a1f3d",
  },
];

export default function InvestPage() {
  const { data: user } = useGetMe();
  const { data: allOrders } = useListOrders({ userId: user?.id });
  const [, setLocation] = useLocation();

  // Show deposits that were made for investment plans
  const myInvestments = (allOrders ?? []).filter(
    o => o.type === "deposit" && o.description?.toLowerCase().includes("plan")
  );

  const handleInvest = (plan: typeof PLANS[0]) => {
    setLocation(`/deposit?plan=${encodeURIComponent(plan.name)}&amount=${plan.amount}`);
  };

  return (
    <AppLayout>
      <div style={{ padding: "40px", maxWidth: 1100, margin: "0 auto", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Investment Plans</p>
          <h1 style={{ fontSize: "clamp(28px,4vw,40px)", fontWeight: 300, margin: "0 0 12px" }}>Choose Your Plan</h1>
          <p style={{ color: "#8b95a1", fontSize: 15 }}>
            Select a plan below — you'll be taken straight to deposit to fund it.
          </p>
        </div>

        {/* Active investments */}
        {myInvestments.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ fontSize: 13, letterSpacing: "0.2em", color: "#8b95a1", textTransform: "uppercase", marginBottom: 16 }}>Your Investment Deposits</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myInvestments.map(inv => (
                <div key={inv.id} style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ color: "#e8eaec", fontWeight: 500 }}>{inv.description}</div>
                    <div style={{ color: "#8b95a1", fontSize: 12, marginTop: 2 }}>{format(new Date(inv.createdAt), "MMM dd, yyyy")}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#e8eaec" }}>${inv.amount.toLocaleString()}</div>
                    <span style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
                      background: inv.status === "confirmed" ? "rgba(34,197,94,0.15)" : inv.status === "cancelled" ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)",
                      color: inv.status === "confirmed" ? "#22c55e" : inv.status === "cancelled" ? "#ef4444" : "#eab308",
                    }}>
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Illustrative growth chart */}
        <div style={{ marginBottom: 48, background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, padding: "28px 28px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 14, color: "#e8eaec", fontWeight: 500, margin: 0 }}>Illustrative Portfolio Growth</h3>
            <span style={{ fontSize: 11, color: "#8b95a1" }}>Sample data — for illustration only, not actual returns</span>
          </div>
          <div style={{ width: "100%", height: 220, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_CHART_DATA} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="investGrowthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e31937" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#e31937" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1a2332" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#8b95a1" tick={{ fontSize: 11, fill: "#8b95a1" }} axisLine={{ stroke: "#1a2332" }} tickLine={false} />
                <YAxis stroke="#8b95a1" tick={{ fontSize: 11, fill: "#8b95a1" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip
                  contentStyle={{ background: "#0a0f18", border: "1px solid #1a2332", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#8b95a1" }}
                  itemStyle={{ color: "#e8eaec" }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]}
                />
                <Area type="monotone" dataKey="value" stroke="#e31937" strokeWidth={2} fill="url(#investGrowthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: plan.color, border: `1px solid ${plan.border}`,
              borderRadius: 12, padding: "36px 28px", position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column",
            }}>
              {plan.highlight && (
                <div style={{ position: "absolute", top: 0, right: 0, background: "#e31937", color: "#fff", fontSize: 10, letterSpacing: "0.15em", padding: "6px 16px", borderBottomLeftRadius: 8, fontWeight: 700 }}>POPULAR</div>
              )}
              <div style={{ fontSize: 12, letterSpacing: "0.2em", color: "#8b95a1", textTransform: "uppercase", marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: "#e8eaec", marginBottom: 2 }}>${plan.amount.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: "#8b95a1", marginBottom: 16 }}>one-time deposit</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "14px" }}>
                {[["Monthly", plan.monthly], ["Term", plan.term], ["Total Return", plan.totalReturn]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: "#8b95a1", letterSpacing: "0.1em" }}>{k}</div>
                    <div style={{ fontSize: 15, color: plan.highlight ? "#60a5fa" : "#e8eaec", fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>

              <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {plan.perks.map(p => (
                  <li key={p} style={{ display: "flex", gap: 10, fontSize: 13, color: "#c0c8d4", alignItems: "flex-start" }}>
                    <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>{p}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleInvest(plan)}
                style={{
                  width: "100%", padding: "13px 0",
                  background: plan.highlight ? "#e31937" : "transparent",
                  border: `1px solid ${plan.highlight ? "#e31937" : "#2e3843"}`,
                  color: plan.highlight ? "#fff" : "#c0c8d4",
                  borderRadius: 4, cursor: "pointer",
                  fontSize: 13, letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase",
                }}
              >
                Deposit & Invest →
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, background: "#0d1520", border: "1px solid #1a2332", borderRadius: 8, padding: "24px" }}>
          <h3 style={{ fontSize: 14, color: "#e8eaec", fontWeight: 500, marginBottom: 8 }}>How it works</h3>
          <ol style={{ paddingLeft: 20, color: "#8b95a1", fontSize: 13, lineHeight: 2 }}>
            <li>Select a plan and click <strong style={{ color: "#e8eaec" }}>Deposit & Invest</strong>.</li>
            <li>Complete your deposit via Wire Transfer, USDT, or Card.</li>
            <li>Our team confirms your deposit and activates the plan within 24 hours.</li>
            <li>Monthly returns are credited directly to your Aureon Capital wallet.</li>
            <li>At term end, your principal is returned alongside the final payout.</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
