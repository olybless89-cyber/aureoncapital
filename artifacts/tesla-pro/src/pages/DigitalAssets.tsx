import { useListOrders, useGetMe } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { useLocation } from "wouter";

const ASSETS = [
  {
    id: "starlink-residential",
    name: "Starlink Residential",
    tagline: "High-speed satellite internet — anywhere on Earth",
    price: 599,
    recurring: "$120/mo",
    icon: "🛰️",
    badge: "POPULAR",
    features: ["Up to 220 Mbps download", "Unlimited data", "Priority support", "Hardware included"],
  },
  {
    id: "starlink-business",
    name: "Starlink Business",
    tagline: "Enterprise-grade connectivity for professionals",
    price: 2_500,
    recurring: "$500/mo",
    icon: "📡",
    badge: "PREMIUM",
    features: ["Up to 350 Mbps download", "Priority network access", "24/7 business support", "Dedicated IP address"],
  },
  {
    id: "fsd-license",
    name: "Full Self-Driving (FSD)",
    tagline: "Lifetime FSD capability license — transferable",
    price: 8_000,
    recurring: null,
    icon: "🤖",
    badge: "EXCLUSIVE",
    features: ["Autopilot included", "Navigate on Autopilot", "Auto Lane Change", "Autopark & Smart Summon"],
  },
  {
    id: "tesla-energy-powerwall",
    name: "Powerwall 3 License",
    tagline: "Home energy management & solar integration",
    price: 1_200,
    recurring: null,
    icon: "⚡",
    badge: "",
    features: ["Storm Watch auto-charge", "Time-Based Control", "Mobile app monitoring", "Grid export management"],
  },
  {
    id: "supercharger-credits",
    name: "Supercharger Credits — 500 kWh",
    tagline: "Pre-loaded charging credits valid at all Superchargers",
    price: 150,
    recurring: null,
    icon: "🔌",
    badge: "",
    features: ["Valid worldwide", "No expiry", "V3 Supercharger compatible", "Instant activation"],
  },
  {
    id: "tesla-insurance-bundle",
    name: "Tesla Insurance Bundle",
    tagline: "12-month comprehensive coverage — digitally issued",
    price: 1_800,
    recurring: null,
    icon: "🛡️",
    badge: "NEW",
    features: ["Real-time premium tracking", "Fast claims via app", "Comprehensive + collision", "Gap coverage included"],
  },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#2a2310", color: "#f59e0b" },
  confirmed:  { bg: "#0f2318", color: "#22c55e" },
  processing: { bg: "#1a2332", color: "#60a5fa" },
  delivered:  { bg: "#0f2318", color: "#22c55e" },
  cancelled:  { bg: "#2a1a1a", color: "#ef4444" },
};

const BADGE_COLOR: Record<string, string> = {
  POPULAR:   "#e31937",
  PREMIUM:   "#d97706",
  EXCLUSIVE: "#7c3aed",
  NEW:       "#0ea5e9",
};

export default function DigitalAssetsPage() {
  const { data: user } = useGetMe();
  const { data: orders, isLoading } = useListOrders({ userId: user?.id });
  const [, setLocation] = useLocation();

  const myAssets = (orders ?? [])
    .filter(o => (o.type as string) === "digital")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handlePurchase = (asset: typeof ASSETS[0]) => {
    if (!user) { setLocation("/login"); return; }
    setLocation(`/deposit?plan=${encodeURIComponent(`Digital Asset — ${asset.name}`)}&amount=${asset.price}`);
  };

  return (
    <AppLayout>
      <div style={{ padding: "40px", maxWidth: 1100, margin: "0 auto", color: "#e8eaec", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#e31937", textTransform: "uppercase", marginBottom: 8 }}>Tesla Ecosystem</p>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px" }}>Digital Assets</h1>
          <p style={{ color: "#8b95a1", fontSize: 14 }}>Starlink subscriptions, FSD licenses, Supercharger credits, and more — delivered digitally.</p>
        </div>

        {/* Asset Catalog */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginBottom: 48 }}>
          {ASSETS.map(asset => (
            <div key={asset.id} style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", position: "relative" }}>
              {asset.badge && (
                <div style={{ position: "absolute", top: 16, right: 16, background: BADGE_COLOR[asset.badge] ?? "#e31937", color: "#fff", fontSize: 10, letterSpacing: "0.15em", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
                  {asset.badge}
                </div>
              )}
              <div style={{ fontSize: 36, marginBottom: 12 }}>{asset.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: "#e8eaec" }}>{asset.name}</h3>
              <p style={{ fontSize: 13, color: "#8b95a1", margin: "0 0 16px", lineHeight: 1.5 }}>{asset.tagline}</p>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                {asset.features.map(f => (
                  <li key={f} style={{ fontSize: 12, color: "#8b95a1", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#e31937" }}>${asset.price.toLocaleString()}</span>
                  {asset.recurring && <span style={{ fontSize: 13, color: "#8b95a1", marginBottom: 2 }}>+ {asset.recurring}</span>}
                </div>
                <button
                  onClick={() => handlePurchase(asset)}
                  style={{ width: "100%", padding: "11px 0", background: "#e31937", border: "none", color: "#fff", borderRadius: 4, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* My Purchased Assets */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 400, marginBottom: 16, color: "#c0c8d4" }}>My Digital Assets</h2>
          {isLoading && <div style={{ color: "#8b95a1", padding: 24 }}>Loading…</div>}
          {!isLoading && myAssets.length === 0 && (
            <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 10, padding: 32, textAlign: "center", color: "#8b95a1" }}>
              No digital assets purchased yet.
            </div>
          )}
          {!isLoading && myAssets.length > 0 && (
            <div style={{ background: "#0d1520", border: "1px solid #1a2332", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a2332" }}>
                    {["Date", "Asset", "Amount", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myAssets.map((a, i) => {
                    const sc = STATUS_STYLE[a.status] ?? { bg: "#1a2332", color: "#c0c8d4" };
                    return (
                      <tr key={a.id} style={{ borderBottom: i < myAssets.length - 1 ? "1px solid #0f1824" : "none" }}>
                        <td style={{ padding: "12px 16px", color: "#8b95a1", fontSize: 13 }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13 }}>{a.description.replace("Digital Asset — ", "")}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>${a.amount.toLocaleString()}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{a.status.toUpperCase()}</span>
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
