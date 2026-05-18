/**
 * decisionPolicy.ts
 * Pure deterministic policy rules for the Decision Engine.
 * No imports from ethers, arcClient, or signalEngine — zero side effects.
 * Every rule must be explainable in a hackathon demo in one sentence.
 *
 * Rule priority (evaluated top-to-bottom, first match wins):
 *  1. avgConfidence < 50                                    → request-more-intelligence
 *  2. risk-off  + avgConfidence < 75                        → hold
 *  3. risk-off  + avgConfidence >= 75                       → settle-defensive (0.001 ETH)
 *  4. neutral                                               → settle-small     (0.002 ETH)
 *  5. risk-on   + avgConfidence >= 75 + opportunity > risk  → settle-normal    (0.005 ETH)
 *  6. (default)                                             → hold
 */

import type { MarketRegimeResult, PolicyResult } from "./decisionTypes";
import type { SettlementAction } from "./settlementTypes";

const AMOUNTS: Record<SettlementAction, string> = {
  "hold": "0",
  "request-more-intelligence": "0",
  "settle-defensive": "0.001",
  "settle-small": "0.002",
  "settle-normal": "0.005",
};

export function evaluatePolicy(regime: MarketRegimeResult): PolicyResult {
  const { regime: marketRegime, avgRisk, avgOpportunity, avgConfidence } = regime;

  // Rule 1 — universal intelligence guard
  if (avgConfidence < 50) {
    return {
      action: "request-more-intelligence",
      amount: AMOUNTS["request-more-intelligence"],
      rationale: [
        `Confidence ${avgConfidence}/100 is below minimum threshold of 50.`,
        "Signal quality is insufficient for a settlement decision.",
      ],
      riskControls: [
        "No transaction sent.",
        "Awaiting higher-confidence signal refresh.",
      ],
    };
  }

  // Rule 2 — risk-off, insufficient confidence to act defensively
  // Threshold 75: risk-off conditions require high conviction before any settlement.
  if (marketRegime === "risk-off" && avgConfidence < 75) {
    return {
      action: "hold",
      amount: AMOUNTS["hold"],
      rationale: [
        `Regime: ${marketRegime}. Confidence: ${avgConfidence}/100.`,
        `Risk score ${avgRisk} dominates opportunity ${avgOpportunity}.`,
        "Risk-off regime detected — holding until confidence reaches 75 threshold.",
      ],
      riskControls: [
        "No transaction sent in risk-off regime.",
        "Position held until confidence reaches 75/100 or regime improves.",
      ],
    };
  }

  // Rule 3 — risk-off with high confidence → minimal defensive action
  if (marketRegime === "risk-off" && avgConfidence >= 75) {
    return {
      action: "settle-defensive",
      amount: AMOUNTS["settle-defensive"],
      rationale: [
        `Regime: ${marketRegime}. Confidence: ${avgConfidence}/100.`,
        "Defensive settlement: minimal exposure in risk-off conditions.",
        `Opportunity: ${avgOpportunity}, Risk: ${avgRisk}.`,
      ],
      riskControls: [
        `Minimal amount: ${AMOUNTS["settle-defensive"]} ETH.`,
        "Defensive posture selected due to elevated risk environment.",
        "Treasury-to-agent transfer only.",
      ],
    };
  }

  // Rule 4 — neutral regime → cautious participation
  if (marketRegime === "neutral") {
    return {
      action: "settle-small",
      amount: AMOUNTS["settle-small"],
      rationale: [
        `Regime: ${marketRegime}. Confidence: ${avgConfidence}/100.`,
        "Neutral regime allows cautious participation.",
        `Balanced scores — Opportunity: ${avgOpportunity}, Risk: ${avgRisk}.`,
      ],
      riskControls: [
        `Small position: ${AMOUNTS["settle-small"]} ETH.`,
        "Neutral regime — no aggressive positioning.",
      ],
    };
  }

  // Rule 5 — risk-on with strong conviction
  if (
    marketRegime === "risk-on" &&
    avgConfidence >= 75 &&
    avgOpportunity > avgRisk
  ) {
    return {
      action: "settle-normal",
      amount: AMOUNTS["settle-normal"],
      rationale: [
        `Regime: ${marketRegime}. Confidence: ${avgConfidence}/100.`,
        `Opportunity ${avgOpportunity} exceeds risk ${avgRisk}.`,
        "Strong conviction in risk-on conditions warrants normal settlement.",
      ],
      riskControls: [
        `Normal amount: ${AMOUNTS["settle-normal"]} ETH.`,
        "Opportunity/risk ratio validated before settlement.",
        "Confidence threshold of 75 enforced for risk-on actions.",
      ],
    };
  }

  // Rule 6 — conservative fallback (risk-on without strong enough conviction)
  return {
    action: "hold",
    amount: AMOUNTS["hold"],
    rationale: [
      `Regime: ${marketRegime}. Confidence: ${avgConfidence}/100.`,
      "Risk-on regime but conviction insufficient to act.",
      `Opportunity (${avgOpportunity}) does not exceed risk (${avgRisk}), or confidence below 75.`,
    ],
    riskControls: [
      "Conservative fallback: hold position.",
      "No transaction without clear opportunity/risk advantage.",
    ],
  };
}
