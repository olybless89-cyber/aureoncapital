import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useGetMe, useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function WithdrawPage() {
  const { data: user } = useGetMe();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState("bank");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [done, setDone] = useState(false);

  const max = user?.balance || 0;

  const handleWithdraw = () => {
    const val = Number(amount);
    if (!val || val < 50) {
      toast({ title: "Invalid amount", description: "Minimum withdrawal is $50.", variant: "destructive" });
      return;
    }
    if (val > max) {
      toast({ title: "Insufficient balance", description: `Your available balance is $${max.toLocaleString()}.`, variant: "destructive" });
      return;
    }
    if (!accountName || !accountNumber) {
      toast({ title: "Missing details", description: "Please enter your account details.", variant: "destructive" });
      return;
    }
    createOrder.mutate({
      data: {
        type: "withdrawal",
        description: `Withdrawal to ${method === "bank" ? `Bank: ${accountName} — ${accountNumber}` : `USDT Wallet: ${accountNumber}`}`,
        amount: val,
      }
    }, {
      onSuccess: () => setDone(true),
      onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <AppLayout>
      <div style={{ padding: "40px", maxWidth: 520, margin: "0 auto", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Wallet</p>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px" }}>Withdraw Funds</h1>
          <p style={{ color: "#8b95a1", fontSize: 14 }}>Request a withdrawal from your wallet balance.</p>
        </div>

        {/* Balance */}
        <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 10, padding: "20px 24px", marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#8b95a1", letterSpacing: "0.1em" }}>AVAILABLE BALANCE</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#22c55e", marginTop: 4 }}>
            ${max.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📤</div>
            <h2 style={{ fontSize: 22, fontWeight: 400, color: "#e8eaec", marginBottom: 12 }}>Withdrawal Requested</h2>
            <p style={{ color: "#8b95a1", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Your withdrawal of <strong style={{ color: "#e8eaec" }}>${Number(amount).toLocaleString()}</strong> is being processed.
              Funds will arrive within 1–3 business days after admin approval.
            </p>
            <button onClick={() => { setDone(false); setAmount(""); setAccountName(""); setAccountNumber(""); }} style={{ padding: "12px 28px", background: "#e31937", border: "none", color: "#fff", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              New Request
            </button>
          </div>
        ) : (
          <>
            {/* Amount */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Amount (USD)</div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8b95a1", fontSize: 16 }}>$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount === "" ? "" : amount}
                  onChange={e => setAmount(e.target.value ? Number(e.target.value) : "")}
                  max={max}
                  style={{ width: "100%", padding: "13px 16px 13px 28px", background: "#0d1520", border: "1px solid #1a2332", borderRadius: 6, color: "#e8eaec", fontSize: 18, outline: "none", boxSizing: "border-box", fontWeight: 600 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: "#8b95a1" }}>Min: $50</span>
                <button onClick={() => setAmount(max)} style={{ background: "none", border: "none", color: "#e31937", fontSize: 11, cursor: "pointer", letterSpacing: "0.05em" }}>MAX</button>
              </div>
            </div>

            {/* Method */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Withdrawal Method</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[["bank", "🏦 Bank Transfer"], ["crypto", "💎 USDT TRC-20"]].map(([id, label]) => (
                  <button key={id} onClick={() => setMethod(id)} style={{
                    flex: 1, padding: "12px", borderRadius: 8,
                    background: method === id ? "#0d1a2e" : "#0a0f18",
                    border: `1px solid ${method === id ? "#1e3a5f" : "#1a2332"}`,
                    color: method === id ? "#e8eaec" : "#8b95a1",
                    fontSize: 13, cursor: "pointer", fontWeight: method === id ? 500 : 400,
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Account details */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                {method === "bank" ? "Bank Details" : "Wallet Address"}
              </div>
              {method === "bank" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    placeholder="Account holder name"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    style={{ padding: "12px 14px", background: "#0d1520", border: "1px solid #1a2332", borderRadius: 6, color: "#e8eaec", fontSize: 14, outline: "none" }}
                  />
                  <input
                    placeholder="Account number / IBAN"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    style={{ padding: "12px 14px", background: "#0d1520", border: "1px solid #1a2332", borderRadius: 6, color: "#e8eaec", fontSize: 14, outline: "none" }}
                  />
                </div>
              ) : (
                <input
                  placeholder="TRC-20 USDT wallet address"
                  value={accountNumber}
                  onChange={e => { setAccountNumber(e.target.value); setAccountName("USDT"); }}
                  style={{ width: "100%", padding: "12px 14px", background: "#0d1520", border: "1px solid #1a2332", borderRadius: 6, color: "#e8eaec", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              )}
            </div>

            <div style={{ background: "#0a1520", border: "1px solid #1a2332", borderRadius: 6, padding: "12px 14px", fontSize: 12, color: "#8b95a1", lineHeight: 1.6, marginBottom: 20 }}>
              ⚠️ Processing time: 1–3 business days after admin approval. Ensure all details are correct before submitting.
            </div>

            <button
              onClick={handleWithdraw}
              disabled={createOrder.isPending || !amount}
              style={{
                width: "100%", padding: "14px 0", background: "#e31937", border: "none",
                color: "#fff", borderRadius: 4, fontSize: 14, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                opacity: createOrder.isPending || !amount ? 0.6 : 1,
              }}
            >
              {createOrder.isPending ? "Submitting…" : `Request Withdrawal — $${Number(amount || 0).toLocaleString()}`}
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
