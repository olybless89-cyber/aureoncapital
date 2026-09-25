import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateOrder, useLogout, useListOrders } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { BitcoinPaymentPanel } from "@/components/BitcoinPaymentPanel";
import { MEMBERSHIP_TIERS } from "@/lib/payments";

// Full-screen paywall rendered by AppLayout in place of the app whenever a
// logged-in, non-admin user's account is still "status: pending" — i.e.
// they haven't paid (or haven't yet been confirmed for) the one-time BTC
// membership activation fee. See routes/auth.ts (registration sets
// status:"pending") and routes/orders.ts (confirming a membership_fee order
// flips it to "active", regardless of which tier/amount was paid).
export function MembershipGate({ user }: { user: { id: string; firstName: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const logoutMutation = useLogout();
  const { data: orders } = useListOrders({ userId: user.id });
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [tierId, setTierId] = useState(MEMBERSHIP_TIERS[0].id);

  const selectedTier = MEMBERSHIP_TIERS.find(t => t.id === tierId) ?? MEMBERSHIP_TIERS[0];

  // Once a membership_fee order exists, keep showing the "waiting on admin"
  // state on every future visit/refresh — don't make the user pay twice or
  // re-show the payment form just because local component state reset.
  const existingFeeOrder = (orders ?? []).find(o => o.type === "membership_fee");
  const awaitingConfirmation = justSubmitted || !!existingFeeOrder;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearToken();
        setLocation("/login");
      },
    });
  };

  const handleSubmit = () => {
    createOrder.mutate({
      data: {
        type: "membership_fee",
        description: `${selectedTier.name} Membership Activation Fee ($${selectedTier.amount.toLocaleString()}) — paid via Bitcoin (BTC)`,
        amount: selectedTier.amount,
      },
    }, {
      onSuccess: () => setJustSubmitted(true),
      onError: (err: any) => {
        toast({ title: "Couldn't submit", description: err?.data?.message || err?.message || "Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#080d14", color: "#e8eaec",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ maxWidth: 560, width: "100%", background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, padding: "40px 36px" }}>
        {awaitingConfirmation ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 22, fontWeight: 400, margin: "0 0 12px" }}>Payment Submitted</h1>
            <p style={{ color: "#8b95a1", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              We've received your membership activation request. Our team will confirm your Bitcoin payment and activate your account shortly — you'll get an email once it's live. Refresh this page after confirmation to continue.
            </p>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#8b95a1", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Membership</p>
            <h1 style={{ fontSize: 26, fontWeight: 300, margin: "0 0 12px" }}>Activate Your Account</h1>
            <p style={{ color: "#8b95a1", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Hi {user.firstName} — choose a one-time membership tier to activate your account and unlock investing, the Tesla showroom, and markets.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {MEMBERSHIP_TIERS.map(tier => (
                <label
                  key={tier.id}
                  onClick={() => setTierId(tier.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "16px 18px",
                    background: tierId === tier.id ? "#0d1a2e" : "#0a0f18",
                    border: `1px solid ${tierId === tier.id ? "#1e3a5f" : "#1a2332"}`,
                    borderRadius: 8, cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", marginTop: 2, flexShrink: 0,
                    border: `2px solid ${tierId === tier.id ? "#e31937" : "#2e3843"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {tierId === tier.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e31937" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 15, color: "#e8eaec", fontWeight: 600 }}>{tier.name}</span>
                      <span style={{ fontSize: 18, color: "#e8eaec", fontWeight: 700 }}>${tier.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#8b95a1", marginBottom: 8 }}>{tier.tagline}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {tier.perks.map(p => (
                        <span key={p} style={{ fontSize: 11, color: "#8b95a1", background: "#111a28", border: "1px solid #1a2332", borderRadius: 20, padding: "3px 10px" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <BitcoinPaymentPanel usdAmount={selectedTier.amount} />
            </div>

            <button
              onClick={handleSubmit}
              disabled={createOrder.isPending}
              style={{
                width: "100%", padding: "14px 0", background: "#e31937", border: "none",
                color: "#fff", borderRadius: 4, fontSize: 14, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                opacity: createOrder.isPending ? 0.7 : 1, marginBottom: 16,
              }}
            >
              {createOrder.isPending ? "Submitting…" : `I've Sent My Payment — $${selectedTier.amount.toLocaleString()}`}
            </button>

            <div style={{ textAlign: "center" }}>
              <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#8b95a1", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
