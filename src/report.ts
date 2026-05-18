import fs from "fs";
import path from "path";
import { SignalAnalysis } from "./signalEngine";

type RegimeResult = {
  regime: string;
  avgRisk: number;
  avgOpportunity: number;
  avgConfidence: number;
};

type TxResult = {
  label: string;
  fromRole: string;
  toRole: string;
  amount: string;
  txHash: string;
  blockNumber: number | null | undefined;
  status: string;
};

export function saveScenarioReport(
  analyses: SignalAnalysis[],
  regime: RegimeResult,
  txResults: TxResult[]
) {
  const reportsDir = path.join(process.cwd(), "reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const reportPath = path.join(
    reportsDir,
    `arc-market-agent-report-${timestamp}.md`
  );

  const report = `# ARC Market Agent Report

## Executive Summary

Market regime detected: **${regime.regime}**

Average risk score: **${regime.avgRisk}/100**  
Average opportunity score: **${regime.avgOpportunity}/100**  
Average confidence: **${regime.avgConfidence}/100**

## Signal Analysis

${analyses
  .map(
    (signal) => `### ${signal.id} — ${signal.title}

Classification: **${signal.classification}**  
Risk score: **${signal.riskScore}/100**  
Opportunity score: **${signal.opportunityScore}/100**  
Confidence: **${signal.confidence}/100**  

Rationale: ${signal.rationale}
`
  )
  .join("\n")}

## Treasury Decision

The agent used the detected market regime to trigger a settlement flow on Arc Testnet.

If regime is risk-off:
- preserve stablecoin reserves
- fund only limited agent budget
- pay selectively for external market data

If regime is risk-on:
- increase experimental allocation
- route more budget to agents

Current action:
- treasury funded agent
- agent paid merchant for market data service

## ARC Settlement Results

${txResults
  .map(
    (tx) => `### ${tx.label}

From: **${tx.fromRole}**  
To: **${tx.toRole}**  
Amount: **${tx.amount}**  
Status: **${tx.status}**  
Block: **${tx.blockNumber ?? "N/A"}**  
Explorer: https://testnet.arcscan.app/tx/${tx.txHash}
`
  )
  .join("\n")}

## Hackathon Narrative

This MVP demonstrates a basic signal-to-settlement loop:

\`\`\`text
market signal → regime detection → treasury decision → agent settlement on Arc
\`\`\`

The core thesis: AI agents can become market participants when they can reason about market signals and settle actions through stablecoin-native infrastructure.
`;

  fs.writeFileSync(reportPath, report);

  console.log("");
  console.log("Report saved:");
  console.log(reportPath);
}