/**
 * decisionTypes.ts
 * Types specific to the Decision Engine layer.
 * Imports from settlementTypes — does NOT duplicate them.
 * Imports from signalEngine only with "import type" (verbatimModuleSyntax).
 */

import type { SettlementAction, ProviderName, AssetType, MarketRegime } from "./settlementTypes";

/**
 * Aggregate market regime result — mirrors the shape returned by
 * signalEngine.getMarketRegime(). Defined here to avoid coupling
 * decisionPolicy / decisionEngine directly to signalEngine's internals.
 */
export interface MarketRegimeResult {
  regime: MarketRegime;
  avgRisk: number;
  avgOpportunity: number;
  avgConfidence: number;
}

/**
 * Output of evaluatePolicy(). Pure data — no side effects.
 */
export interface PolicyResult {
  action: SettlementAction;
  /** Amount in ETH as decimal string. "0" for hold actions. */
  amount: string;
  rationale: string[];
  riskControls: string[];
}

/**
 * Full output of runDecisionEngine().
 * Everything needed to build a SettlementRequest and a DecisionReport.
 */
export interface DecisionOutput {
  action: SettlementAction;
  provider: ProviderName;
  asset: AssetType;
  amount: string;
  regime: MarketRegime;
  avgConfidence: number;
  avgRisk: number;
  avgOpportunity: number;
  rationale: string[];
  riskControls: string[];
}
