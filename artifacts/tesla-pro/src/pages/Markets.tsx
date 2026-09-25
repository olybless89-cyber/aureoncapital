import { useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { AuthLayout } from "@/components/AuthLayout";
import { STOCKS, type Stock } from "@/lib/stocks";
import { StockLogo } from "@/components/StockLogo";

function PurchaseModal({ stock, onClose }: { stock: Stock; onClose: () => void }) {
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1); // 1=details, 2=payment, 3=confirm
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState("bank");

  const total = stock.price * qty;

  const handlePurchase = () => {
    if (!user) { navigate("/login"); return; }
    createOrder.mutate({
      data: {
        type: "purchase",
        description: `${qty} shares of ${stock.symbol} (${stock.name}) — Via: ${method === "bank" ? "Bank Transfer" : "Wallet Balance"}`,
        amount: total,
      }
    }, {
      onSuccess: () => {
        setStep(3);
      },
      onError: (err: any) => {
        toast({ title: "Order Failed", description: err.message || "Please try again.", variant: "destructive" });
      }
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12,
        width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto",
      }}>
        {step < 3 ? (
          <>
            <div style={{ padding: "28px 32px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8b95a1", letterSpacing: "0.2em", textTransform: "uppercase" }}>Purchase</div>
                  <h2 style={{ fontSize: 22, fontWeight: 400, color: "#e8eaec", margin: "4px 0 0" }}>{stock.symbol} — {stock.name}</h2>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b95a1", fontSize: 20, cursor: "pointer" }}>×</button>
              </div>
              {/* Steps */}
              <div style={{ display: "flex", gap: 8, marginTop: 20, marginBottom: 28 }}>
                {["Configuration", "Payment"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: step > i + 1 ? "#22c55e" : step === i + 1 ? "#e31937" : "#1a2332",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: step >= i + 1 ? "#fff" : "#8b95a1",
                    }}>{step > i + 1 ? "✓" : i + 1}</div>
                    <span style={{ fontSize: 12, color: step === i + 1 ? "#e8eaec" : "#8b95a1" }}>{s}</span>
                    {i < 1 && <div style={{ width: 20, height: 1, background: "#1a2332" }} />}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "0 32px 32px" }}>
              {step === 1 && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, color: "#8b95a1", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Number of Shares</div>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={e => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{
                        width: "100%", padding: "12px 14px", background: "#0a0f18",
                        border: "1px solid #1a2332", borderRadius: 8, color: "#e8eaec",
                        fontSize: 15, fontFamily: "inherit", outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ background: "#0a0f18", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[["Sector", stock.sector], ["Market Cap", stock.marketCap], ["Volume", stock.volume], ["Price/Share", `$${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]].map(([k, v]) => (
                        <div key={k as string}>
                          <div style={{ fontSize: 11, color: "#8b95a1", marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 14, color: "#e8eaec", fontWeight: 500 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <span style={{ color: "#8b95a1", fontSize: 14 }}>Total</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: "#e31937" }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <button onClick={() => setStep(2)} style={{ width: "100%", padding: "13px 0", background: "#e31937", border: "none", color: "#fff", borderRadius: 4, fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                    Continue to Payment
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: "#8b95a1", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Payment Method</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { id: "bank", label: "Bank Transfer", sub: "Wire transfer — instructions will be sent via email" },
                        { id: "wallet", label: "Wallet Balance", sub: "Deduct from your Aureon Capital wallet" },
                      ].map(m => (
                        <label key={m.id} onClick={() => setMethod(m.id)} style={{
                          display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
                          background: method === m.id ? "#0d1a2e" : "#0a0f18",
                          border: `1px solid ${method === m.id ? "#1e3a5f" : "#1a2332"}`,
                          borderRadius: 8, cursor: "pointer",
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%", marginTop: 2, flexShrink: 0,
                            border: `2px solid ${method === m.id ? "#e31937" : "#2e3843"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {method === m.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e31937" }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, color: "#e8eaec", fontWeight: 500 }}>{m.label}</div>
                            <div style={{ fontSize: 12, color: "#8b95a1", marginTop: 2 }}>{m.sub}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "#0a0f18", borderRadius: 8, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#8b95a1", lineHeight: 1.6 }}>
                    ℹ️ Your order will be reviewed and shares will be credited to your portfolio within 1–2 business days after payment clearance.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStep(1)} style={{ flex: 1, padding: "13px 0", background: "transparent", border: "1px solid #2e3843", color: "#8b95a1", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>
                      Back
                    </button>
                    <button onClick={handlePurchase} disabled={createOrder.isPending} style={{ flex: 2, padding: "13px 0", background: "#e31937", border: "none", color: "#fff", borderRadius: 4, fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", opacity: createOrder.isPending ? 0.7 : 1 }}>
                      {createOrder.isPending ? "Processing…" : `Confirm Order — $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 400, color: "#e8eaec", marginBottom: 12 }}>Order Submitted!</h2>
            <p style={{ color: "#8b95a1", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Your {qty} shares of {stock.symbol} order has been received. Our team will contact you within 24 hours with payment instructions and next steps.
            </p>
            <button onClick={onClose} style={{ padding: "12px 32px", background: "#e31937", border: "none", color: "#fff", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const { data: user } = useGetMe();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<Stock | null>(null);
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");

  const filtered = STOCKS.filter(s => {
    if (filter === "gainers") return s.changePercent > 0;
    if (filter === "losers") return s.changePercent < 0;
    return true;
  });

  const Wrapper = user ? AppLayout : ({ children }: any) => (
    <div style={{ minHeight: "100vh", background: "#080d14", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid #1a2332" }}>
        <span style={{ fontWeight: 300, fontSize: 13, letterSpacing: "0.12em", color: "#8b95a1", cursor: "pointer" }} onClick={() => navigate("/")}>AUREON CAPITAL</span>
        <button onClick={() => navigate("/login")} style={{ padding: "8px 20px", background: "#e31937", border: "none", color: "#fff", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Sign In</button>
      </nav>
      {children}
    </div>
  );

  return (
    <Wrapper>
      <div style={{ padding: "40px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Aureon Capital</p>
          <h1 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 300, color: "#e8eaec", margin: "0 0 16px" }}>Markets</h1>
          <p style={{ color: "#8b95a1", fontSize: 15 }}>Trade top stocks and ETFs — reviewed and executed by our team.</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {[["all", "All"], ["gainers", "Gainers"], ["losers", "Losers"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k as any)} style={{
              padding: "8px 18px", borderRadius: 20,
              background: filter === k ? "#e31937" : "#0d1520",
              border: `1px solid ${filter === k ? "#e31937" : "#1a2332"}`,
              color: filter === k ? "#fff" : "#8b95a1", fontSize: 13, cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
          {filtered.map(stock => (
            <div key={stock.id} style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, overflow: "hidden", position: "relative" }}>
              {stock.badge && (
                <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, background: stock.badge === "LOW RISK" ? "#7c3aed" : stock.badge === "NEW" ? "#0ea5e9" : stock.badge === "TRENDING" ? "#d97706" : "#e31937", color: "#fff", fontSize: 10, letterSpacing: "0.15em", padding: "4px 10px", borderRadius: 4, fontWeight: 700 }}>
                  {stock.badge}
                </div>
              )}
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0d1520, #131c2b)" }}>
                <StockLogo symbol={stock.symbol} logoDomain={stock.logoDomain} size={96} fallbackFontSize={56} />
              </div>
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: 20, fontWeight: 500, color: "#e8eaec", margin: "0 0 4px" }}>{stock.name}</h3>
                <p style={{ fontSize: 13, color: "#8b95a1", margin: "0 0 16px" }}>{stock.sector}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20, background: "#0a0f18", borderRadius: 8, padding: "12px" }}>
                  {[["Cap", stock.marketCap], ["Vol", stock.volume], ["Chg", `${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent}%`]].map(([k, v]) => (
                    <div key={k as string} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "#8b95a1" }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: k === "Chg" ? (stock.changePercent >= 0 ? "#22c55e" : "#ef4444") : "#e8eaec" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#e31937" }}>${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <button onClick={() => { if (!user) { navigate("/login"); } else { setSelected(stock); } }} style={{
                    padding: "10px 22px", background: "#e31937", border: "none",
                    color: "#fff", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
                  }}>
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <PurchaseModal stock={selected} onClose={() => setSelected(null)} />}
    </Wrapper>
  );
}
