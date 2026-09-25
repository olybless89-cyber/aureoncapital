import { useState } from "react";

// Renders a company's real logo (via Google's favicon service — stable,
// free, no API key) with a graceful fallback to the stylized ticker-letter
// placeholder if the logo fails to load (unknown domain, offline, etc).
// Note: Clearbit's old public Logo API (logo.clearbit.com) was retired in
// 2025 and no longer resolves — don't switch back to it.
export function StockLogo({
  symbol,
  logoDomain,
  size = 88,
  fallbackFontSize,
}: {
  symbol: string;
  logoDomain: string;
  size?: number;
  fallbackFontSize?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        style={{
          fontSize: fallbackFontSize ?? size * 0.64,
          fontWeight: 800,
          color: "#1a2332",
          letterSpacing: "-0.02em",
        }}
      >
        {symbol}
      </span>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.18,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: size * 0.14,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${logoDomain}&sz=256`}
        alt={`${symbol} logo`}
        onError={() => setFailed(true)}
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
