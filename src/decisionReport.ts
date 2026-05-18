/**
 * decisionReport.ts
 * Generates markdown reports for the Decision Settlement scenario.
 * Separate from saveScenarioReport() in report.ts — different structure,
 * different fields, does NOT modify the existing report format.
 */

import fs from "fs";
import path from "path";
import type { DecisionOutput } from "./decisionTypes";
import type { SettlementResult } from "./settlementTypes";

export function saveDecisionReport(
  decision: DecisionOutput,
  result: SettlementResult,
  signalsFile?: string
): void {
  const reportsDir = path.join(process.cwd(), "reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(
    reportsDir,
    `arc-decision-report-${timestamp}.md`
  );

  const settlementSection = buildSettlementSection(result);

  const signalsLabel = signalsFile ?? "data/signals.json";
  const settlementPipelineLabel = buildSettlementPipelineLabel(result);

  const report = `# ARC Decision Settlement Report

## Executive Summary

Market regime detected: **${decision.regime}**

Confidence: **${decision.avgConfidence}/100**  
Risk score: **${decision.avgRisk}/100**  
Opportunity score: **${decision.avgOpportunity}/100**

Decision: **${decision.action}**  
Provider: **${decision.provider}**  
Asset: **${decision.asset}**  
Amount: **${decision.amount === "0" ? "no transaction" : decision.amount + " ETH"}**

---

## Decision Engine Rationale

${decision.rationale.map((r) => `- ${r}`).join("\n")}

## Risk Controls Applied

${decision.riskControls.map((r) => `- ${r}`).join("\n")}

---

## Settlement Result

${settlementSection}

---

## Signal-to-Settlement Pipeline

\`\`\`text
${signalsLabel}
  → Signal Engine    (analyzeSignals + getMarketRegime)
  → Decision Engine  (deterministic policy rules)
  → Settlement Router
  → ${settlementPipelineLabel}
  → This Report
\`\`\`

_Generated: ${new Date().toISOString()}_  
_Arc Testnet | Chain ID: 5042002 | Explorer: https://testnet.arcscan.app_
`;

  fs.writeFileSync(reportPath, report);

  console.log("");
  console.log("Decision report saved:");
  console.log(reportPath);
}

function buildSettlementPipelineLabel(result: SettlementResult): string {
  if (result.status === "held") {
    return "No transaction sent";
  }

  if (result.status === "simulated") {
    return "Mock Provider (simulated)";
  }

  if (result.status === "settled") {
    return "Arc Testnet (live transaction)";
  }

  return "Arc Testnet (failed or unconfirmed transaction)";
}

function buildSettlementSection(result: SettlementResult): string {
  if (result.status === "held") {
    return `**Status: HELD — No transaction sent**

> ${result.rationale[0] ?? "Action was hold or request-more-intelligence."}

The decision engine determined that current market conditions do not warrant
a settlement transaction. No funds were moved.`;
  }

  if (result.status === "settled" && result.txHash && result.blockNumber) {
    return `**Status: SETTLED ✅**

| Field | Value |
|---|---|
| TX Hash | \`${result.txHash}\` |
| Block | ${result.blockNumber} |
| Amount | ${result.amount} ETH |
| Provider | ${result.provider} |
| Explorer | https://testnet.arcscan.app/tx/${result.txHash} |`;
  }

  if (result.status === "simulated" && result.txHash) {
    return `**Status: SIMULATED 🔵**

> No real transaction was sent. Running in mock mode.

| Field | Value |
|---|---|
| Simulated TX Hash | \`${result.txHash}\` |
| Simulated Block | ${result.blockNumber ?? "N/A"} |
| Amount | ${result.amount} ETH |

To run a real transaction, ensure \`data/wallets.json\` has funded wallets
and the \`arc-native\` provider is registered in \`decisionScenario.ts\`.`;
  }

  if (result.status === "failed") {
    return `**Status: FAILED ❌**

Error: ${result.errorMessage ?? "Unknown error"}

${result.txHash ? `TX Hash (unconfirmed): \`${result.txHash}\`` : "No transaction hash available."}`;
  }

  return `Status: ${result.status}`;
}
