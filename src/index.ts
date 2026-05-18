import { testConnection } from "./arcClient";
import { provider } from "./arcClient";
import { runBasicScenario } from "./scenarioRunner";
import {
  createTestnetWallet,
  showWalletBalances,
  sendNativeUSDC,
} from "./walletManager";
import { runDecisionScenario } from "./decisionScenario";

async function main() {
  const command = process.argv[2];

  if (command === "test") {
    await testConnection();
    return;
  }

  if (command === "create-wallet") {
    const role = process.argv[3] || "agent";
    createTestnetWallet(role);
    return;
  }

  if (command === "balances") {
    await showWalletBalances();
    return;
  }

  if (command === "send") {
    await sendNativeUSDC(0, 1, "0.01");
    return;
  }

  if (command === "scenario:basic") {
    await runBasicScenario();
    return;
  }

  if (command === "scenario:decision") {
    await runDecisionScenario();
    return;
  }

  console.log("Available commands:");
  console.log("npm run test-arc");
  console.log("npm run create-wallet -- treasury");
  console.log("npm run create-wallet -- agent");
  console.log("npm run create-wallet -- merchant");
  console.log("npm run balances");
  console.log("npm run send");
  console.log("npm run scenario:basic");
  console.log("npm run scenario:decision");
}

main()
  .catch((err) => {
    console.error("ERROR:");
    console.error(err);
  })
  .finally(() => {
    provider.destroy();
    process.exit(process.exitCode ?? 0);
  });
