/**
 * settlementTypes.ts
 * Base types for the settlement layer.
 * Kept minimal — no Circle dependencies, native only for MVP.
 */

export type SettlementAction =
  | "hold"
  | "settle-defensive"
  | "settle-small"
  | "settle-normal"
  | "request-more-intelligence";

/** Providers registered with SettlementRouter. Circle entries reserved for future. */
export type ProviderName = "arc-native" | "mock";

/** Asset types supported in current MVP. USDC added when Circle providers are active. */
export type AssetType = "native";

/** Must match the literal union returned by signalEngine.getMarketRegime(). */
export type MarketRegime = "risk-off" | "neutral" | "risk-on";

export interface SettlementRequest {
  action: SettlementAction;
  provider: ProviderName;
  asset: AssetType;
  /** Amount in ETH as a decimal string, e.g. "0.001". "0" for hold actions. */
  amount: string;
  /** Private key of the sending wallet (treasury). Read from data/wallets.json. */
  fromPrivateKey: string;
  /** Recipient address (agent). Read from data/wallets.json. */
  toAddress: string;
  regime: MarketRegime;
  avgConfidence: number;
  avgRisk: number;
  avgOpportunity: number;
  rationale: string[];
  riskControls: string[];
}

export interface SettlementResult {
  success: boolean;
  provider: ProviderName;
  action: SettlementAction;
  asset: AssetType;
  amount: string;
  /** "settled" = confirmed on-chain | "held" = no tx sent | "failed" = error | "simulated" = mock */
  status: "settled" | "held" | "failed" | "simulated";
  timestamp: string;
  regime: MarketRegime;
  avgConfidence: number;
  avgRisk: number;
  avgOpportunity: number;
  rationale: string[];
  riskControls: string[];
  /** Present only when status === "settled" or "simulated". */
  txHash?: string;
  /** Present only when status === "settled" or "simulated". */
  blockNumber?: number;
  /** Present only when status === "failed". */
  errorMessage?: string;
}
