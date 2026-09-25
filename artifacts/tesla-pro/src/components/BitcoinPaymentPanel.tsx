import { useState } from "react";
import { BTC_WALLET_ADDRESS } from "@/lib/payments";

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

// Reusable Bitcoin payment instructions block — QR code + address + copy
// button. Used anywhere a user needs to pay via BTC (car purchases,
// membership activation, wallet/investment deposits). Payments are manually
// confirmed by an admin, same as the existing bank/USDT flows.
export function BitcoinPaymentPanel({ usdAmount }: { usdAmount?: number }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`bitcoin:${BTC_WALLET_ADDRESS}`)}`;

  return (
    <div style={{ background: "#060c14", border: "1px solid #1a2332", borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 11, color: "#8b95a1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Send Bitcoin (BTC) to this address
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ background: "#fff", padding: 8, borderRadius: 8, flexShrink: 0, lineHeight: 0 }}>
          <img src={qrSrc} alt="BTC wallet address QR code" width={140} height={140} style={{ display: "block" }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <code style={{ fontSize: 12, color: "#e8eaec", wordBreak: "break-all", flex: 1 }}>{BTC_WALLET_ADDRESS}</code>
            <CopyButton text={BTC_WALLET_ADDRESS} />
          </div>
          {usdAmount != null ? (
            <p style={{ color: "#8b95a1", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              Send the BTC equivalent of <strong style={{ color: "#e8eaec" }}>${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> at the current exchange rate. Bitcoin (BTC) only — sending any other coin to this address may result in permanent loss of funds.
            </p>
          ) : (
            <p style={{ color: "#8b95a1", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              Bitcoin (BTC) only — sending any other coin to this address may result in permanent loss of funds. Your order will be updated once our team confirms the on-chain payment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
