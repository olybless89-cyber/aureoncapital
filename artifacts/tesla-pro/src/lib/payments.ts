// Central Bitcoin payment configuration, used for car purchases (Showroom),
// membership activation (MembershipGate), and investment/wallet deposits
// (Deposit page). All BTC payments are manually reconciled and confirmed by
// an admin — there is no on-chain payment verification in this app.
export const BTC_WALLET_ADDRESS = "bc1qqt3wtaxcm9dzcxrjd9yr4xsk4aplsq5pj24t39";

// One-time account-activation tiers offered on MembershipGate.tsx. Both
// create a "membership_fee" order — the backend (routes/orders.ts) flips
// the account to status:"active" as soon as any membership_fee order is
// confirmed by an admin, regardless of which tier/amount it was for. Kept
// as an ordered array (rather than separate constants) so MembershipGate
// can render them as selectable cards and so adding/removing/repricing a
// tier later is a one-place edit.
export interface MembershipTier {
  id: string;
  name: string;
  amount: number;
  tagline: string;
  perks: string[];
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "standard",
    name: "Standard",
    amount: 99,
    tagline: "Get in the door",
    perks: ["Full platform access", "Markets & Tesla Showroom", "Rewards program", "Community access"],
  },
  {
    id: "premium",
    name: "Premium",
    amount: 2_500,
    tagline: "For serious members",
    perks: ["Everything in Standard", "Priority admin approval", "Dedicated account advisor", "VIP giveaway entries", "Early Tesla Showroom access"],
  },
];

// Back-compat default — the first (cheapest) tier. Most call sites should
// prefer letting the member choose via MEMBERSHIP_TIERS instead.
export const MEMBERSHIP_FEE_USD = MEMBERSHIP_TIERS[0].amount;
