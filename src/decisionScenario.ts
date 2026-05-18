/**
 * decisionScenario.ts
 * New hackathon demo scenario: Signal Engine → Decision Engine → Settlement → Report.
 *
 * Does NOT replace or modify the existing scenarioRunner.ts / scenario:basic.
 *
 * Flow:
 *  1. Read treasury and agent wallets from data/wallets.json (same pattern as scenarioRunner)
 *  2. Run Decision Engine (reads signals.json internally via signalEngine)
 *  3. Build SettlementRequest and route through SettlementRouter
 *  4. Save decision report to reports/
 *
 * Exports runDecisionScenario() so it can be dispatched from index.ts.
 * Also callable directly: tsx src/decisionScenario.ts
 *
 * No top-level await. All async logic inside runDecisionScenario().
 */

import fs from "fs";
import path from "path";
import { provider } from "./arcClient";
import { runDecisionEngine } from "./decisionEngine";
import {
  ArcNativeSettlementProvider,
  MockSettlementProvider,
  SettlementRouter,
} from "./settlementProvider";
import { saveDecisionReport } from "./decisionReport";
import type { SettlementRequest } from "./settlementTypes";

// Mirrors StoredWallet in walletManager.ts and scenarioRunner.ts.
// Defined locally to avoid modifying those files.
type StoredWallet = {
  id: string;
  role: string;
  address: string;
  privateKey: string;
  createdAt: string;
};

const walletsPath = path.join(process.cwd(), "data", "wallets.json");

function readWallets(): StoredWallet[] {
  const raw = fs.readFileSync(walletsPath, "utf-8");
  return JSON.parse(raw) as StoredWallet[];
}

/** noUncheckedIndexedAccess: .find() can return undefined — throw explicitly. */
function findWalletByRole(role: string): StoredWallet {
  const wallets = readWallets();
  const wallet = wallets.find((w) => w.role === role);
  if (!wallet) {
    throw new Error(
      `Wallet with role "${role}" not found in ${walletsPath}. ` +
      `Run: npm run create-wallet -- ${role}`
    );
  }
  return wallet;
}

export async function runDecisionScenario(signalsFilePath?: string): Promise<void> {
  const signalsLabel = signalsFilePath ?? "data/signals.json";

  console.log("=".repeat(60));
  console.log("  Decision Settlement Scenario");
  console.log("  signal → decision → settlement → report");
  console.log(`  Signals: ${signalsLabel}`);
  console.log("=".repeat(60));

  // Step 1 — Load wallets
  console.log("\n[1/4] Loading wallets from data/wallets.json...");
  const treasury = findWalletByRole("treasury");
  const agent = findWalletByRole("agent");
  console.log(`      Treasury: ${treasury.address}`);
  console.log(`      Agent:    ${agent.address}`);

  // Step 2 — Decision Engine
  console.log("\n[2/4] Running Decision Engine...");
  const decision = runDecisionEngine(signalsFilePath);
  console.log(`      → Action:   ${decision.action}`);
  console.log(`      → Amount:   ${decision.amount} ETH`);
  console.log(`      → Provider: ${decision.provider}`);

  // Step 3 — Settlement Router
  console.log("\n[3/4] Routing to settlement provider...");

  const router = new SettlementRouter();
  router.register(new ArcNativeSettlementProvider());
  router.register(new MockSettlementProvider());

  const request: SettlementRequest = {
    action: decision.action,
    provider: decision.provider,
    asset: decision.asset,
    amount: decision.amount,
    fromPrivateKey: treasury.privateKey,
    toAddress: agent.address,
    regime: decision.regime,
    avgConfidence: decision.avgConfidence,
    avgRisk: decision.avgRisk,
    avgOpportunity: decision.avgOpportunity,
    rationale: decision.rationale,
    riskControls: decision.riskControls,
  };

  const result = await router.route(request);

  if (result.status === "settled") {
    console.log(`\n      ✅ SETTLED`);
    console.log(`         TX:    ${result.txHash ?? "N/A"}`);
    console.log(`         Block: ${result.blockNumber ?? "N/A"}`);
    console.log(`         https://testnet.arcscan.app/tx/${result.txHash ?? ""}`);
  } else if (result.status === "simulated") {
    console.log(`\n      🔵 SIMULATED (mock provider — no real transaction)`);
    console.log(`         TX:    ${result.txHash ?? "N/A"}`);
    console.log(`         Block: ${result.blockNumber ?? "N/A"}`);
  } else if (result.status === "held") {
    console.log(`\n      ⏸  HELD — No transaction sent`);
    const firstRationale = result.rationale[0];
    if (firstRationale !== undefined) {
      console.log(`         Reason: ${firstRationale}`);
    }
  } else {
    console.error(`\n      ❌ FAILED: ${result.errorMessage ?? "unknown error"}`);
  }

  // Step 4 — Report
  console.log("\n[4/4] Saving decision report...");
  saveDecisionReport(decision, result, signalsLabel);

  console.log("\n" + "=".repeat(60));
  console.log("  Scenario complete.");
  console.log("=".repeat(60));
}

// Run directly when called as: tsx src/decisionScenario.ts [optional-signals-path]
// Not executed when imported by index.ts (require.main !== module)
if (require.main === module) {
  // process.argv[2] is the optional signals file path (e.g. data/demo/signals-risk-off.json)
  const cliSignalsPath = process.argv[2];
  runDecisionScenario(cliSignalsPath)
    .catch((err: unknown) => {
      console.error(
        "\n[FATAL]",
        err instanceof Error ? err.message : String(err)
      );
      process.exitCode = 1;
    })
    .finally(() => {
      provider.destroy();
      process.exit(process.exitCode ?? 0);
    });
}
