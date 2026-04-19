/** Human-readable labels for `ApplicationType` enum values */
export function applicationTypeLabel(type: string): string {
  switch (type) {
    case "WALLET_BANK_AGENT":
      return "Wallet agent";
    case "AGENT":
      return "Referral agent";
    default:
      return type.replace(/_/g, " ");
  }
}
