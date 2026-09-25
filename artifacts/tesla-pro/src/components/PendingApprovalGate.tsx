import { useLocation } from "wouter";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";

// Full-screen gate rendered by AppLayout in place of the app whenever a
// logged-in, non-admin user's account is still "status: pending" -- i.e.
// they've registered (for free -- no payment involved) but an admin hasn't
// approved them yet. See routes/auth.ts (registration sets status:"pending")
// and Admin > Users (routes/users.ts PATCH /users/:userId, Users.tsx
// Approve button) for how an admin flips the account to "active".
export function PendingApprovalGate({ user }: { user: { firstName: string } }) {
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { refetch, isFetching } = useGetMe();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearToken();
        setLocation("/login");
      },
    });
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#080d14", color: "#e8eaec",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, padding: "40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Account Review</p>
        <h1 style={{ fontSize: 22, fontWeight: 400, margin: "0 0 12px" }}>Hi {user.firstName}, you're almost in</h1>
        <p style={{ color: "#8b95a1", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Your account has been created — no payment needed. Our team just needs to review and approve
          new accounts before granting dashboard access. You'll be able to sign in as normal once
          that's done, usually shortly after you register.
        </p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            width: "100%", padding: "14px 0", background: "#e31937", border: "none",
            color: "#fff", borderRadius: 4, fontSize: 14, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
            opacity: isFetching ? 0.7 : 1, marginBottom: 16,
          }}
        >
          {isFetching ? "Checking…" : "Check Status"}
        </button>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#8b95a1", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
