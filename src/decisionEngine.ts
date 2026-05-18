/**
 * decisionEngine.ts
 * Decision Engine v1 — deterministic and auditable.
 *
 * Responsibilities:
 *  - Call analyzeSignals() and getMarketRegime() from the existing Signal Engine
 *  - Apply evaluatePolicy() rules
 *  - Return a DecisionOutput ready for SettlementRouter
 *
 * Does NOT know about ethers, providers, or Circle internals.
 * Settlement routing happens downstream in settlementProvider.ts.
 */

import { analyzeSignals, getMarketRegime } from "./signalEngine";
import { evaluatePolicy } from "./decisionPolicy";
import type { DecisionOutput, MarketRegimeResult } from "./decisionTypes";

export function runDecisionEngine(signalsFilePath?: string): DecisionOutput {
  console.log("[DecisionEngine] Analyzing market signals...");

  const analyses = analyzeSignals(signalsFilePath);
  const raw = getMarketRegime(analyses);

  // Shape the result into our internal type (same fields, typed MarketRegime)
  const regime: MarketRegimeResult = {
    regime: raw.regime,
    avgRisk: raw.avgRisk,
    avgOpportunity: raw.avgOpportunity,
    avgConfidence: raw.avgConfidence,
  };

  console.log(
    `[DecisionEngine] Regime: ${regime.regime} | ` +
    `Confidence: ${regime.avgConfidence}/100 | ` +
    `Risk: ${regime.avgRisk} | ` +
    `Opportunity: ${regime.avgOpportunity}`
  );

  const policy = evaluatePolicy(regime);

  console.log(
    `[DecisionEngine] Decision: ${policy.action} | ` +
    `Amount: ${policy.amount} ETH | ` +
    `Provider: arc-native`
  );

  return {
    action: policy.action,
    provider: "arc-native",
    asset: "native",
    amount: policy.amount,
    regime: regime.regime,
    avgConfidence: regime.avgConfidence,
    avgRisk: regime.avgRisk,
    avgOpportunity: regime.avgOpportunity,
    rationale: policy.rationale,
    riskControls: policy.riskControls,
  };
}
