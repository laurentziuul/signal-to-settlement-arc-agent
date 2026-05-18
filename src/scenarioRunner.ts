import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { provider } from "./arcClient";
import { analyzeSignals, getMarketRegime } from "./signalEngine";
import { saveScenarioReport } from "./report";

const walletsPath = path.join(process.cwd(), "data", "wallets.json");
const ARC_TESTNET_CHAIN_ID = 5042002n;

type StoredWallet = {
  id: string;
  role: string;
  address: string;
  privateKey: string;
  createdAt: string;
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

function readWallets(): StoredWallet[] {
  const raw = fs.readFileSync(walletsPath, "utf-8");
  return JSON.parse(raw);
}

function findWalletByRole(role: string): StoredWallet {
  const wallets = readWallets();

  const wallet = wallets.find((w) => w.role === role);

  if (!wallet) {
    throw new Error(`Wallet with role "${role}" not found`);
  }

  return wallet;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function assertArcTestnet() {
  const chainIdHex = await provider.send("eth_chainId", []);
  const chainId = BigInt(chainIdHex);

  if (chainId !== ARC_TESTNET_CHAIN_ID) {
    throw new Error(
      `Chain ID mismatch: expected ${ARC_TESTNET_CHAIN_ID}, got ${chainId}. Refusing to send transaction.`
    );
  }
}

async function sendPayment(
  from: StoredWallet,
  to: StoredWallet,
  amount: string,
  label: string
): Promise<TxResult> {
  const signer = new ethers.Wallet(from.privateKey, provider);

  console.log("");
  console.log(`Step: ${label}`);
  console.log("From:", from.role, from.address);
  console.log("To:", to.role, to.address);
  console.log("Amount:", amount);

  await assertArcTestnet();

  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);

      const tx = await signer.sendTransaction({
        to: to.address,
        value: ethers.parseEther(amount),
      });

      console.log("TX sent:", tx.hash);
      console.log("Waiting confirmation...");
      console.log(`Explorer: https://testnet.arcscan.app/tx/${tx.hash}`);

      const receipt = await Promise.race([
        tx.wait(),
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 45000)
        ),
      ]);

      if (!receipt) {
        console.log("Confirmation timeout after 45s.");
        console.log("TX may be pending, dropped, or not indexed yet.");

        return {
          label,
          fromRole: from.role,
          toRole: to.role,
          amount,
          txHash: tx.hash,
          blockNumber: null,
          status: "timeout",
        };
      }

      console.log("Confirmed block:", receipt.blockNumber);

      return {
        label,
        fromRole: from.role,
        toRole: to.role,
        amount,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        status: "confirmed",
      };
    } catch (err: any) {
      const message =
        err?.shortMessage ||
        err?.error?.message ||
        err?.message ||
        "Unknown error";

      console.log("TX failed:", message);

      if (message.includes("txpool is full") && attempt < maxRetries) {
        const waitMs = attempt * 5000;

        console.log(`RPC txpool full. Retrying in ${waitMs / 1000}s...`);

        await sleep(waitMs);
        continue;
      }

      throw err;
    }
  }

  throw new Error("Max retries reached");
}

export async function runBasicScenario() {
  console.log("Running Basic Agentic Settlement Scenario");
  console.log("Flow: market signals → regime detection → treasury → agent → merchant");

  const analyses = analyzeSignals();
  const regime = getMarketRegime(analyses);

  console.log("");
  console.log("Market regime detected:", regime.regime);
  console.log("Average risk:", regime.avgRisk);
  console.log("Average opportunity:", regime.avgOpportunity);
  console.log("Average confidence:", regime.avgConfidence);
  console.table(analyses);

  const treasury = findWalletByRole("treasury");
  const agent = findWalletByRole("agent");
  const merchant = findWalletByRole("merchant");

  const results: TxResult[] = [];

  results.push(
    await sendPayment(
      treasury,
      agent,
      "1.0",
      "Treasury funds agent budget"
    )
  );

  results.push(
    await sendPayment(
      agent,
      merchant,
      "0.25",
      "Agent pays merchant for market data service"
    )
  );

  console.log("");
  console.log("Scenario complete");
  console.table(results);

  saveScenarioReport(analyses, regime, results);
}
