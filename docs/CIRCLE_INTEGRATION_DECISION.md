# Circle Integration Decision

> **Status:** Arc Native is the default live settlement provider.  
> Circle providers are **not implemented** in this MVP.  
> This document records Circle's Arc Testnet capabilities for the next implementation phase.

---

## Why Arc Native Remains the Default

The project has working Arc Testnet settlement with confirmed on-chain transactions
(see `reports/arc-market-agent-report-2026-05-13T19-01-26-196Z.md`, blocks 42041658
and 42041667). Arc Native settlement is:

- **Live and tested** — real tx hashes, real block numbers, zero fakes
- **Zero additional credentials** — uses existing `data/wallets.json`
- **Deterministic** — chainId enforced, retry logic in place, timeout handled
- **Chain-safe** — `ArcNativeSettlementProvider` enforces `chainId === 5042002n`
  and throws before sending any transaction if the chain does not match

Circle providers are documented here for the next sprint. They are not
implemented in the current codebase to avoid adding complexity and dependencies
that could break the MVP demo.

---

## Circle Findings — Arc Testnet Support (Verified 2025)

### Agent Wallets ✅

| Property | Value |
|---|---|
| Chain identifier | `ARC-TESTNET` |
| CLI install | `npm install -g @circle-fin/cli` |
| CLI Node.js requirement | v20.18.2+ |
| CLI login | `circle wallet login you@example.com --testnet` |
| List wallets | `circle wallet list --type agent --chain ARC-TESTNET` |
| Fund wallet | `circle wallet fund --address 0xYourAddress --chain ARC-TESTNET` |
| Transfer | `circle wallet transfer 0xRecipient --amount 1.0 --address 0xWallet --chain ARC-TESTNET` |
| Testnet auto-fund | 20 USDC on creation |
| **Spending policies** | ❌ **NOT available on testnet — mainnet only** |

**Do not claim policy enforcement in Arc Testnet demos.**

Programmatic access requires `@circle-fin/developer-controlled-wallets` SDK
(not yet added as a dependency).

---

### Gateway ✅

| Property | Value |
|---|---|
| Arc Testnet domain ID | `26` |
| Arc Testnet chain name | `arcTestnet` |
| USDC address on Arc | `0x3600000000000000000000000000000000000000` |
| x402 nanopayments | ✅ Supported via Gateway on Arc Testnet |
| Gas-free payments | Requires prior Gateway USDC deposit |

---

### CCTP V2 ✅ — Standard Transfer only

| Property | Value |
|---|---|
| Arc Testnet domain ID | `26` |
| Transfer type | **Standard Transfer ONLY** |
| **Fast Transfer** | ❌ **NOT available from Arc Testnet** |
| TokenMessengerV2 | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` |
| MessageTransmitterV2 | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` |
| TokenMinterV2 | `0xb43db544E2c27092c107639Ad201b3dEfAbcF192` |
| MessageV2 | `0xbaC0179bB358A8936169a63408C8481D582390C4` |
| Iris sandbox API | `https://iris-api-sandbox.circle.com/v2/messages/26?transactionHash={txHash}` |

**Do not claim Fast Transfer support from Arc. It is not available.**

---

### x402 / Nanopayments ✅

| Property | Value |
|---|---|
| Supported via | Circle Gateway (domainId: 26, arcTestnet) |
| Gas-free | Yes, with prior Gateway USDC deposit |
| Signer | `PRIVATE_KEY` from env |
| Required packages | `@circle-fin/x402-batching`, `@x402/core`, `@x402/evm` |
| Node.js requirement | v18+ |

x402 packages are **not yet installed**. Add them only when activating
`X402PaymentProvider`.

---

## Known Limitations

| Limitation | Detail |
|---|---|
| Agent Wallet spending policies | Not available on testnet. Do not mention in Arc Testnet demos. |
| CCTP Fast Transfer | Not available from Arc Testnet. Standard Transfer only. |
| Circle providers | Not implemented in current MVP. All Circle logic is deferred to a future sprint. |
| x402 packages | Not installed. Will be added when `X402PaymentProvider` is implemented. |
| Circle CLI | Requires Node.js v20.18.2+. Run `node --version` before installing. |

---

## Current MVP Settlement Architecture

```text
data/signals.json
  → src/signalEngine.ts      analyzeSignals() + getMarketRegime()
  → src/decisionEngine.ts    runDecisionEngine()   [deterministic policy]
  → src/decisionPolicy.ts    evaluatePolicy()       [6 rules, no LLM]
  → src/settlementProvider.ts  SettlementRouter
      → ArcNativeSettlementProvider  [DEFAULT — live Arc Testnet]
      → MockSettlementProvider       [optional — no real transactions]
  → src/decisionReport.ts    saveDecisionReport()
  → reports/arc-decision-report-*.md
```

---

## Next Implementation Steps (Post-MVP)

### Step 1 — Circle Agent Wallet (USDC payments)

```bash
npm install @circle-fin/developer-controlled-wallets
```

1. Create `src/circle/CircleAgentWalletProvider.ts` implementing `SettlementProvider`
2. Add `ProviderName` entry: `"circle-agent-wallet"` in `settlementTypes.ts`
3. Add env vars: `CIRCLE_AGENT_WALLET_ENABLED=true`, `CIRCLE_AGENT_WALLET_ADDRESS=0x...`
4. Register in `decisionScenario.ts` router

### Step 2 — Circle Gateway (USDC via Gateway API)

1. Obtain Circle API key from Circle Developer Console
2. Create `src/circle/CircleGatewayProvider.ts`
3. Add env vars: `CIRCLE_GATEWAY_ENABLED=true`, `CIRCLE_GATEWAY_API_KEY=...`

### Step 3 — CCTP V2 (Standard cross-chain transfer)

Flow:
1. Approve USDC to `TokenMessengerV2` on Arc Testnet
2. Call `depositForBurn(amount, destDomain, mintRecipient, burnToken)`
3. Capture `MessageSent` event → extract `messageHash`
4. Poll Iris sandbox: `GET /v2/messages/26?transactionHash={txHash}`
5. Call `receiveMessage(message, attestation)` on destination chain

Create `src/circle/CircleCctpProvider.ts`

### Step 4 — x402 Nanopayments

```bash
npm install @circle-fin/x402-batching @x402/core @x402/evm
```

1. Deposit USDC to Circle Gateway on Arc Testnet
2. Create `src/circle/X402PaymentProvider.ts`
3. Add env vars: `X402_ENABLED=true`, `X402_PAY_FACILITATOR_URL=...`, `X402_RESOURCE_URL=...`

---

## Future Environment Variables

```env
# Circle Agent Wallet
# CIRCLE_AGENT_WALLET_ENABLED=true
# CIRCLE_AGENT_WALLET_ADDRESS=0x...

# Circle Gateway
# CIRCLE_GATEWAY_ENABLED=true
# CIRCLE_GATEWAY_API_KEY=your-api-key

# Circle CCTP
# CIRCLE_CCTP_ENABLED=true
# CIRCLE_CCTP_DESTINATION_DOMAIN=0
# CIRCLE_CCTP_DESTINATION_ADDRESS=0x...

# x402 Nanopayments
# X402_ENABLED=true
# X402_PAY_FACILITATOR_URL=https://...
# X402_RESOURCE_URL=https://...
```

---

*Arc Testnet | Chain ID: 5042002 | Explorer: https://testnet.arcscan.app*  
*Last updated: 2025*
