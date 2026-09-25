import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const cardStyle: React.CSSProperties = {
  background: "#0d1520",
  border: "1px solid #1a2332",
  borderRadius: 12,
  padding: "24px",
};

const labelStyle: React.CSSProperties = {
  fontSize:  11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#8b95a1",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0b1119",
  border: "1px solid #1a2332",
  borderRadius:  8,
  padding: "10px 12px",
  color: "#e8eaec",
  fontSize:  14,
  outline: "none",
};

const fieldErrorStyle: React.CSSProperties = {
  color: "#ef4444",
  fontSize:  12,
  marginTop:  6,
};

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <p style={fieldErrorStyle}>{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { data: user } = useGetMe();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ newPassword?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: { newPassword?: string; confirm?: string } = {};
    if (!newPassword || newPassword.length < 8) {
      nextErrors.newPassword = "Password must be at least 8 characters";
    }
    if (newPassword !== confirm) {
      nextErrors.confirm = "Passwords do not match";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Failed to update password");
      }
      toast({ title: "Password updated", description: "Your new password is now active." });
      setNewPassword("");
      setConfirm("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div
        style={{
          padding: "40px",
          maxWidth: 820,
          margin: "0 auto",
          color: "#e8eaec",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p
            style={{
              fontSize:      11,
              letterSpacing: "0.3em",
              color: "#e31937",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >Account</p>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px" }}>Settings</h1>
          <p style={{ color: "#8b95a1", fontSize: 14 }}>
            Manage your account profile, security password, and session.

          </p>
        </div>

        {/* Profile card */}
        {user && (
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <p style={{ ...labelStyle, color: "#e8eaec", fontWeight: 500, marginBottom: 16 }}>Profile</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <p style={labelStyle}>Full name</p>
                <p style={{ fontSize: 15 }}>{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p style={labelStyle}>Email address</p>
                <p style={{ fontSize: 15 }}>{user.email}</p>
              </div>
              <div>
                <p style={labelStyle}>Role</p>
                <p style={{ fontSize: 15, textTransform: "capitalize" }}>{user.role}</p>
              </div>
              <div>
                <p style={labelStyle}>Member code</p>
                <p style={{ fontSize: 15, fontFamily: "monospace" }}>{user.memberCode ?? "—"}</p>
              </div>
              <div>
                <p style={labelStyle}>Status</p>
                <p style={{ fontSize: 15, textTransform: "capitalize" }}>{user.status}</p>
              </div>
              <div>
                <p style={labelStyle}>Member since</p>
                <p style={{ fontSize: 15 }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </p>
              </div>
              {!isAdmin && typeof user.balance === "number" && (
                <div>
                  <p style={labelStyle}>Balance</p>
                  <p style={{ fontSize: 15, color: "#22c55e", fontFamily: "monospace" }}>
                    ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Change password card */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <p style={{ ...labelStyle, color: "#e8eaec", fontWeight: 500, marginBottom: 16 }}>Change password</p>
          <form onSubmit={handleSubmit}>
            <Field label="New password" error={errors.newPassword}>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                style={inputStyle}
              />
            </Field>
            <Field label="Confirm new password" error={errors.confirm}>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                style={inputStyle}
              />
            </Field>
            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 8,
                background: "#e31937",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 22px",
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : "Update password"}
            </button>
          </form>
        </div>

        {/* Session card */}
        <div style={cardStyle}>
          <p style={{ ...labelStyle, color: "#e8eaec", fontWeight: 500, marginBottom: 16 }}>Session</p>
          <p style={{ color: "#8b95a1", fontSize: 14, lineHeight: 1.6 }}>
            You are signed in as <strong style={{ color: "#e8eaec" }}>{user?.email ?? "…"}</strong>.
            To stay protected, use a unique password and avoid sharing your login details.


          </p>
        </div>
      </div>
    </AppLayout>
  );
}
