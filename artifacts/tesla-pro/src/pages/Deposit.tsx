import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useGetMe, useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { BitcoinPaymentPanel } from "@/components/BitcoinPaymentPanel";

const USDT_WALLET = "TNCgyc7SYM7LFHhSaCBcP1ehPEfPw2fpTa";

const AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];
const METHODS = [
  { id: "wire",   label: "Wire Transfer",     icon: "🏦", sub: "International / SWIFT — 1–3 business days" },
  { id: "crypto", label: "USDT (TRC-20)",      icon: "💎", sub: "Tether stablecoin — instant confirmation" },
  { id: "btc",    label: "Bitcoin (BTC)",     icon: "₿", sub: "On-chain BTC — confirmed by our team" },
  { id: "card",   label: "Debit/Credit Card", icon: "💳", sub: "Visa, Mastercard — instant" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      padding: "6px 14px", background: copied ? "#22c55e" : "#1a2332",
      border: `1px solid ${copied ? "#22c55e" : "#2e3843"}`,
      color: copied ? "#fff" : "#8b95a1", borderRadius: 4,
      fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
      transition: "all 0.2s",
    }}>
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return { plan: p.get("plan") ?? "", amount: p.get("amount") ? Number(p.get("amount")) : null };
}

export default function DepositPage() {
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const { plan: planName, amount: planAmount } = getParams();
  const [amount, setAmount] = useState<number | "">(planAmount ?? "");
  const [method, setMethod] = useState("wire");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (planAmount) setAmount(planAmount);
  }, [planAmount]);

  const description = planName
    ? `Deposit for ${planName} Plan via ${METHODS.find(m => m.id === method)?.label}`
    : `Deposit via ${METHODS.find(m => m.id === method)?.label}`;

  const handleSubmit = () => {
    if (!amount || Number(amount) < 100) {
      toast({ title: "Invalid amount", description: "Minimum deposit is $100.", variant: "destructive" });
      return;
    }
    createOrder.mutate({ data: { type: "deposit", description, amount: Number(amount) } }, {
      onSuccess: () => setDone(true),
      onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <AppLayout>
      <div style={{ padding: "40px", maxWidth: 560, margin: "0 auto", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Wallet</p>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px" }}>
            {planName ? `Fund ${planName} Plan` : "Deposit Funds"}
          </h1>
          <p style={{ color: "#8b95a1", fontSize: 14 }}>
            {planName
              ? `Complete your deposit to activate the ${planName} investment plan.`
              : "Add funds to your Aureon Capital wallet balance."}
          </p>
        </div>

        {/* Balance */}
        <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 10, padding: "20px 24px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#8b95a1", letterSpacing: "0.1em" }}>CURRENT BALANCE</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e", marginTop: 4 }}>
              ${(user?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ fontSize: 32 }}>💰</div>
        </div>

        {done ? (
          /* ── Confirmation screen ── */
          <div style={{ padding: "12px 0 48px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 22, fontWeight: 400, color: "#e8eaec", marginBottom: 8 }}>Deposit Submitted</h2>
              <p style={{ color: "#8b95a1", fontSize: 14 }}>
                Your <strong style={{ color: "#e8eaec" }}>${Number(amount).toLocaleString()}</strong> deposit is under review.
              </p>
            </div>

            {/* Method-specific instructions */}
            <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 10, padding: "20px 24px", marginBottom: 28 }}>
              {method === "btc" && (
                <>
                  <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Send Bitcoin</div>
                  <BitcoinPaymentPanel usdAmount={Number(amount)} />
                </>
              )}
              {method === "crypto" && (
                <>
                  <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Send USDT to this address</div>
                  <div style={{ background: "#060c14", border: "1px solid #1a2332", borderRadius: 8, padding: "14px 16px", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#8b95a1", marginBottom: 6 }}>Network: TRON (TRC-20) only</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <code style={{ fontSize: 13, color: "#e8eaec", wordBreak: "break-all", flex: 1 }}>{USDT_WALLET}</code>
                      <CopyButton text={USDT_WALLET} />
                    </div>
                  </div>
                  <p style={{ color: "#8b95a1", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                    Send <strong style={{ color: "#e8eaec" }}>${Number(amount).toLocaleString()} USDT</strong> on the TRC-20 network only. Do <strong style={{ color: "#e31937" }}>not</strong> use ERC-20 or BEP-20 — funds sent on the wrong network cannot be recovered. Once sent, your balance will be updated after confirmation.
                  </p>
                </>
              )}
              {method === "wire" && (
                <>
                  <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Wire Transfer Instructions</div>
                  <p style={{ color: "#8b95a1", fontSize: 13, lineHeight: 1.7, margin: "0 0 12px" }}>
                    Bank details will be sent to <strong style={{ color: "#e8eaec" }}>{user?.email}</strong> shortly. Include your member code as the payment reference.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#8b95a1", marginBottom: 4 }}>YOUR REFERENCE</div>
                      <code style={{ fontSize: 14, color: "#e8eaec" }}>{user?.memberCode ?? "TP-XXXX-XXXX"}</code>
                    </div>
                    <CopyButton text={user?.memberCode ?? ""} />
                  </div>
                </>
              )}
              {method === "card" && (
                <>
                  <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Secure Payment Link</div>
                  <p style={{ color: "#8b95a1", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                    A secure payment link will be sent to <strong style={{ color: "#e8eaec" }}>{user?.email}</strong> shortly. Do not share the link with anyone.
                  </p>
                </>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => { setDone(false); setAmount(planAmount ?? ""); }}
                style={{ padding: "12px 28px", background: "#e31937", border: "none", color: "#fff", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Make Another Deposit
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Plan badge */}
            {planName && (
              <div style={{ background: "rgba(227,25,55,0.08)", border: "1px solid rgba(227,25,55,0.25)", borderRadius: 8, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📈</span>
                <div>
                  <div style={{ fontSize: 12, color: "#e31937", fontWeight: 600, letterSpacing: "0.05em" }}>INVESTMENT PLAN</div>
                  <div style={{ fontSize: 14, color: "#e8eaec" }}>{planName} — ${Number(planAmount).toLocaleString()} recommended</div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Amount (USD)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(a)} style={{
                    padding: "8px 16px", borderRadius: 6,
                    background: amount === a ? "#e31937" : "#0d1520",
                    border: `1px solid ${amount === a ? "#e31937" : "#1a2332"}`,
                    color: amount === a ? "#fff" : "#8b95a1", fontSize: 13, cursor: "pointer",
                  }}>${a.toLocaleString()}</button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Or enter custom amount…"
                value={amount === "" ? "" : amount}
                onChange={e => setAmount(e.target.value ? Number(e.target.value) : "")}
                style={{ width: "100%", padding: "12px 16px", background: "#0d1520", border: "1px solid #1a2332", borderRadius: 6, color: "#e8eaec", fontSize: 15, outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 11, color: "#8b95a1", marginTop: 6 }}>Minimum deposit: $100</div>
            </div>

            {/* Method */}
            <div style={{ marginBottom: method === "crypto" || method === "btc" ? 16 : 28 }}>
              <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Payment Method</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {METHODS.map(m => (
                  <label key={m.id} onClick={() => setMethod(m.id)} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                    background: method === m.id ? "#0d1a2e" : "#0a0f18",
                    border: `1px solid ${method === m.id ? "#1e3a5f" : "#1a2332"}`,
                    borderRadius: 8, cursor: "pointer",
                  }}>
                    <div style={{ fontSize: 22 }}>{m.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "#e8eaec", fontWeight: 500 }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: "#8b95a1" }}>{m.sub}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === m.id ? "#e31937" : "#2e3843"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {method === m.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e31937" }} />}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Inline USDT wallet when crypto selected */}
            {method === "crypto" && (
              <div style={{ background: "#060c14", border: "1px solid #1a2332", borderRadius: 8, padding: "14px 16px", marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Send to this TRC-20 wallet</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <code style={{ fontSize: 12, color: "#e8eaec", wordBreak: "break-all", flex: 1 }}>{USDT_WALLET}</code>
                  <CopyButton text={USDT_WALLET} />
                </div>
              </div>
            )}

            {/* Inline BTC wallet when bitcoin selected */}
            {method === "btc" && (
              <div style={{ marginBottom: 28 }}>
                <BitcoinPaymentPanel usdAmount={Number(amount) || undefined} />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={createOrder.isPending || !amount}
              style={{
                width: "100%", padding: "14px 0", background: "#e31937", border: "none",
                color: "#fff", borderRadius: 4, fontSize: 14, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                opacity: createOrder.isPending || !amount ? 0.6 : 1,
              }}
            >
              {createOrder.isPending ? "Submitting…" : `Submit Deposit — $${Number(amount || 0).toLocaleString()}`}
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
