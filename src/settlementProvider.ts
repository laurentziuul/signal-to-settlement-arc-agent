/**
 * settlementProvider.ts
 * Settlement infrastructure: interface, providers, and router.
 *
 * Providers:
 *  - ArcNativeSettlementProvider  — default live provider (ethers v6, Arc Testnet)
 *  - MockSettlementProvider       — simulated, no real transactions
 *
 * Router:
 *  - SettlementRouter             — dispatches request to the correct provider
 *
 * Safety: ArcNativeSettlementProvider enforces chainId === 5042002n
 * before every transaction. Throws if chain does not match.
 *
 * Circle providers are NOT implemented here yet.
 * See docs/CIRCLE_INTEGRATION_DECISION.md for integration plan.
 */

import { ethers } from "ethers";
import { provider } from "./arcClient";
import type {
  SettlementRequest,
  SettlementResult,
  ProviderName,
} from "./settlementTypes";

const ARC_TESTNET_CHAIN_ID = 5042002n;
const CONFIRM_TIMEOUT_MS = 45_000;

// ---------------------------------------------------------------------------
// SettlementProvider interface
// ---------------------------------------------------------------------------

interface SettlementProvider {
  readonly name: ProviderName;
  isAvailable(): boolean;
  settle(request: SettlementRequest): Promise<SettlementResult>;
}

// ---------------------------------------------------------------------------
// ArcNativeSettlementProvider
// ---------------------------------------------------------------------------

export class ArcNativeSettlementProvider implements SettlementProvider {
  readonly name: ProviderName = "arc-native";

  isAvailable(): boolean {
    return true;
  }

  async settle(request: SettlementRequest): Promise<SettlementResult> {
    const timestamp = new Date().toISOString();

    // Hold guard — no transaction needed
    if (
      request.action === "hold" ||
      request.action === "request-more-intelligence"
    ) {
      console.log(
        `[ArcNative] Action is '${request.action}' — no transaction sent.`
      );
      return {
        success: true,
        provider: this.name,
        action: request.action,
        asset: request.asset,
        amount: "0",
        status: "held",
        timestamp,
        regime: request.regime,
        avgConfidence: request.avgConfidence,
        avgRisk: request.avgRisk,
        avgOpportunity: request.avgOpportunity,
        rationale: request.rationale,
        riskControls: request.riskControls,
      };
    }

    try {
      // Enforce Arc Testnet chain ID before any transaction
      const chainIdHex = await provider.send("eth_chainId", []);
      const chainId = BigInt(chainIdHex);
      if (chainId !== ARC_TESTNET_CHAIN_ID) {
        throw new Error(
          `Chain ID mismatch: expected ${ARC_TESTNET_CHAIN_ID}, ` +
          `got ${chainId}. Refusing to send transaction.`
        );
      }

      const signer = new ethers.Wallet(request.fromPrivateKey, provider);

      console.log(
        `[ArcNative] Chain verified: ${chainId}. ` +
        `Sending ${request.amount} ETH → ${request.toAddress}...`
      );

      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[ArcNative] Attempt ${attempt}/${maxRetries}...`);

          const tx = await signer.sendTransaction({
            to: request.toAddress,
            value: ethers.parseEther(request.amount),
          });

          console.log(`[ArcNative] TX submitted: ${tx.hash}`);
          console.log(`[ArcNative] Explorer: https://testnet.arcscan.app/tx/${tx.hash}`);

          const receipt = await Promise.race<ethers.TransactionReceipt | null>([
            tx.wait(),
            new Promise<null>((resolve) =>
              setTimeout(() => resolve(null), CONFIRM_TIMEOUT_MS)
            ),
          ]);

          if (!receipt) {
            console.log(
              "[ArcNative] Confirmation timeout after 45s. TX may be pending."
            );
            return {
              success: false,
              provider: this.name,
              action: request.action,
              asset: request.asset,
              amount: request.amount,
              status: "failed",
              errorMessage: `Confirmation timeout after ${CONFIRM_TIMEOUT_MS / 1000}s. TX hash: ${tx.hash}`,
              timestamp,
              regime: request.regime,
              avgConfidence: request.avgConfidence,
              avgRisk: request.avgRisk,
              avgOpportunity: request.avgOpportunity,
              rationale: request.rationale,
              riskControls: request.riskControls,
              txHash: tx.hash,
            };
          }

          console.log(`[ArcNative] Confirmed in block: ${receipt.blockNumber}`);

          return {
            success: true,
            provider: this.name,
            action: request.action,
            asset: request.asset,
            amount: request.amount,
            status: "settled",
            timestamp,
            regime: request.regime,
            avgConfidence: request.avgConfidence,
            avgRisk: request.avgRisk,
            avgOpportunity: request.avgOpportunity,
            rationale: request.rationale,
            riskControls: request.riskControls,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
          };
        } catch (err: unknown) {
          const message =
            err !== null &&
            typeof err === "object" &&
            "shortMessage" in err &&
            typeof (err as { shortMessage: unknown }).shortMessage === "string"
              ? (err as { shortMessage: string }).shortMessage
              : err instanceof Error
              ? err.message
              : String(err);

          console.log(`[ArcNative] TX error: ${message}`);

          if (message.includes("txpool is full") && attempt < maxRetries) {
            const waitMs = attempt * 5_000;
            console.log(`[ArcNative] txpool full. Retrying in ${waitMs / 1000}s...`);
            await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
            continue;
          }

          throw err;
        }
      }

      throw new Error("[ArcNative] Max retries reached without success.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[ArcNative] Settlement failed: ${errorMessage}`);

      return {
        success: false,
        provider: this.name,
        action: request.action,
        asset: request.asset,
        amount: request.amount,
        status: "failed",
        errorMessage,
        timestamp,
        regime: request.regime,
        avgConfidence: request.avgConfidence,
        avgRisk: request.avgRisk,
        avgOpportunity: request.avgOpportunity,
        rationale: request.rationale,
        riskControls: request.riskControls,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// MockSettlementProvider
// ---------------------------------------------------------------------------

export class MockSettlementProvider implements SettlementProvider {
  readonly name: ProviderName = "mock";

  isAvailable(): boolean {
    return true;
  }

  async settle(request: SettlementRequest): Promise<SettlementResult> {
    const timestamp = new Date().toISOString();

    await new Promise<void>((resolve) => setTimeout(resolve, 200));

    if (
      request.action === "hold" ||
      request.action === "request-more-intelligence"
    ) {
      console.log(
        `[Mock] Action is '${request.action}' — no simulation needed.`
      );
      return {
        success: true,
        provider: this.name,
        action: request.action,
        asset: request.asset,
        amount: "0",
        status: "held",
        timestamp,
        regime: request.regime,
        avgConfidence: request.avgConfidence,
        avgRisk: request.avgRisk,
        avgOpportunity: request.avgOpportunity,
        rationale: request.rationale,
        riskControls: request.riskControls,
      };
    }

    const fakeTxHash = `0xMOCK_${Date.now().toString(16).toUpperCase()}`;
    const fakeBlock = Math.floor(100_000 + Math.random() * 900_000);

    console.log(
      `[Mock] Simulated: ${request.amount} ETH | txHash: ${fakeTxHash}`
    );

    return {
      success: true,
      provider: this.name,
      action: request.action,
      asset: request.asset,
      amount: request.amount,
      status: "simulated",
      timestamp,
      regime: request.regime,
      avgConfidence: request.avgConfidence,
      avgRisk: request.avgRisk,
      avgOpportunity: request.avgOpportunity,
      rationale: request.rationale,
      riskControls: request.riskControls,
      txHash: fakeTxHash,
      blockNumber: fakeBlock,
    };
  }
}

// ---------------------------------------------------------------------------
// SettlementRouter
// ---------------------------------------------------------------------------

export class SettlementRouter {
  private readonly providers = new Map<ProviderName, SettlementProvider>();

  register(p: SettlementProvider): void {
    this.providers.set(p.name, p);
    console.log(`[Router] Registered provider: ${p.name}`);
  }

  async route(request: SettlementRequest): Promise<SettlementResult> {
    const p = this.providers.get(request.provider);

    if (!p) {
      throw new Error(
        `[Router] No provider registered for '${request.provider}'. ` +
        `Registered: [${[...this.providers.keys()].join(", ")}]`
      );
    }

    if (!p.isAvailable()) {
      throw new Error(
        `[Router] Provider '${request.provider}' is registered but not available.`
      );
    }

    console.log(
      `[Router] Routing action '${request.action}' to provider '${request.provider}'...`
    );

    return p.settle(request);
  }
}
