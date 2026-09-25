import { useListOrders, useGetMe } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { useLocation } from "wouter";

const GIVEAWAYS = [
  {
    id: "cybertruck-giveaway",
    title: "Cybertruck Giveaway",
    prize: "Tesla Cybertruck (Dual Motor)",
    value: 79_990,
    entries: 1_240,
    closes: "2026-08-31",
    img: "https://images.unsplash.com/photo-1698517688825-3d5ca1a5c56f?w=800&q=80",
    entryFee: 50,
    badge: "HOT",
  },
  {
    id: "roadster-giveaway",
    title: "Roadster Giveaway",
    prize: "Tesla Roadster",
    value: 200_000,
    entries: 430,
    closes: "2026-09-15",
    img: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
    entryFee: 100,
    badge: "EXCLUSIVE",
  },
  {
    id: "model3-giveaway",
    title: "Model 3 Draw",
    prize: "Tesla Model 3 Long Range",
    value: 46_990,
    entries: 3_800,
    closes: "2026-08-01",
    img: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
    entryFee: 25,
    badge: "",
  },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#2a2310", color: "#f59e0b" },
  confirmed:  { bg: "#0f2318", color: "#22c55e" },
  processing: { bg: "#1a2332", color: "#60a5fa" },
  cancelled:  { bg: "#2a1a1a", color: "#ef4444" },
};

export default function GiveawayEntriesPage() {
  const { data: user } = useGetMe();
  const { data: orders, isLoading } = useListOrders({ userId: user?.id });
  const [, setLocation] = useLocation();

  const myEntries = (orders ?? [])
    .filter(o => (o.type as string) === "giveaway")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleEnter = (g: typeof GIVEAWAYS[0]) => {
    if (!user) { setLocation("/login"); return; }
    setLocation(`/deposit?plan=${encodeURIComponent(`Giveaway Entry — ${g.title}`)}&amount=${g.entryFee}`);
  };

  return (
    <AppLayout>
      <div style={{ padding: "40px", maxWidth: 1000, margin: "0 auto", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Members Only</p>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px" }}>Giveaway Draws</h1>
          <p style={{ color: "#8b95a1", fontSize: 14 }}>Enter exclusive Tesla giveaways — one entry per draw. Winners announced monthly.</p>
        </div>

        {/* Active Giveaways */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginBottom: 48 }}>
          {GIVEAWAYS.map(g => (
            <div key={g.id} style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, overflow: "hidden", position: "relative" }}>
              {g.badge && (
                <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, background: g.badge === "EXCLUSIVE" ? "#7c3aed" : "#e31937", color: "#fff", fontSize: 10, letterSpacing: "0.15em", padding: "4px 10px", borderRadius: 4, fontWeight: 700 }}>
                  {g.badge}
                </div>
              )}
              <div style={{ height: 180, backgroundImage: `url(${g.img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 4px" }}>{g.title}</h3>
                <p style={{ color: "#8b95a1", fontSize: 13, margin: "0 0 16px" }}>Prize: {g.prize}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, background: "#0a0f18", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  {[["Value", `$${g.value.toLocaleString()}`], ["Entries", g.entries.toLocaleString()], ["Closes", new Date(g.closes).toLocaleDateString(undefined, { month: "short", day: "numeric" })]].map(([k, v]) => (
                    <div key={k as string} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#8b95a1", marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 12, color: "#e8eaec", fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleEnter(g)}
                  style={{ width: "100%", padding: "11px 0", background: "#e31937", border: "none", color: "#fff", borderRadius: 4, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Enter for ${g.entryFee}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* My Entries */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 16, color: "#c0c8d4" }}>My Entries</h2>
          {isLoading && <div style={{ color: "#8b95a1", padding: 24 }}>Loading…</div>}
          {!isLoading && myEntries.length === 0 && (
            <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 10, padding: 32, textAlign: "center", color: "#8b95a1" }}>
              You haven't entered any giveaways yet.
            </div>
          )}
          {!isLoading && myEntries.length > 0 && (
            <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a2332" }}>
                    {["Date", "Draw", "Entry Fee", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myEntries.map((e, i) => {
                    const sc = STATUS_STYLE[e.status] ?? { bg: "#1a2332", color: "#c0c8d4" };
                    return (
                      <tr key={e.id} style={{ borderBottom: i < myEntries.length - 1 ? "1px solid #0f1824" : "none" }}>
                        <td style={{ padding: "12px 16px", color: "#8b95a1", fontSize: 13 }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{e.description}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>${e.amount}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{e.status.toUpperCase()}</span>
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
