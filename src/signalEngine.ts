import fs from "fs";
import path from "path";

const DEFAULT_SIGNALS_PATH = path.join(process.cwd(), "data", "signals.json");

type RawSignal = {
  id: string;
  source: string;
  title: string;
  category: string;
  urgency: "low" | "medium" | "high";
  text: string;
};

export type SignalAnalysis = {
  id: string;
  title: string;
  classification: "structural" | "tactical" | "speculative";
  riskScore: number;
  opportunityScore: number;
  confidence: number;
  rationale: string;
};

function readSignals(filePath?: string): RawSignal[] {
  const resolvedPath = filePath ?? DEFAULT_SIGNALS_PATH;
  const raw = fs.readFileSync(resolvedPath, "utf-8");
  return JSON.parse(raw);
}

function classifySignal(signal: RawSignal): SignalAnalysis {
  const text = `${signal.title} ${signal.text}`.toLowerCase();

  let classification: SignalAnalysis["classification"] = "speculative";
  let riskScore = 0;
  let opportunityScore = 0;
  let confidence = 50;
  const reasons: string[] = [];

  if (
    text.includes("oil") ||
    text.includes("inflation") ||
    text.includes("geopolitical") ||
    text.includes("iran")
  ) {
    classification = "structural";
    riskScore += 35;
    confidence += 15;
    reasons.push("Macro/geopolitical inflation risk detected.");
  }

  if (
    text.includes("funding") ||
    text.includes("liquidity") ||
    text.includes("positioning") ||
    text.includes("squeeze")
  ) {
    classification = "tactical";
    riskScore += 20;
    opportunityScore += 20;
    confidence += 10;
    reasons.push("Market structure / positioning signal detected.");
  }

  if (
    text.includes("prediction market") ||
    text.includes("activity growth") ||
    text.includes("outperforming")
  ) {
    classification = "structural";
    opportunityScore += 35;
    confidence += 10;
    reasons.push("Prediction market growth signal detected.");
  }

  if (signal.urgency === "high") {
    riskScore += 15;
    confidence += 5;
    reasons.push("High urgency increases action priority.");
  }

  if (signal.urgency === "medium") {
    riskScore += 5;
  }

  riskScore = Math.min(riskScore, 100);
  opportunityScore = Math.min(opportunityScore, 100);
  confidence = Math.min(confidence, 95);

  return {
    id: signal.id,
    title: signal.title,
    classification,
    riskScore,
    opportunityScore,
    confidence,
    rationale: reasons.join(" "),
  };
}

export function analyzeSignals(filePath?: string): SignalAnalysis[] {
  const signals = readSignals(filePath);
  return signals.map(classifySignal);
}

export function getMarketRegime(analyses: SignalAnalysis[]) {
  const avgRisk =
    analyses.reduce((sum, item) => sum + item.riskScore, 0) / analyses.length;

  const avgOpportunity =
    analyses.reduce((sum, item) => sum + item.opportunityScore, 0) /
    analyses.length;

  const avgConfidence =
    analyses.reduce((sum, item) => sum + item.confidence, 0) / analyses.length;

  let regime: "risk-off" | "neutral" | "risk-on" = "neutral";

  if (avgRisk >= 45 && avgRisk > avgOpportunity) {
    regime = "risk-off";
  } else if (avgOpportunity >= 45 && avgOpportunity > avgRisk) {
    regime = "risk-on";
  }

  return {
    regime,
    avgRisk: Math.round(avgRisk),
    avgOpportunity: Math.round(avgOpportunity),
    avgConfidence: Math.round(avgConfidence),
  };
}