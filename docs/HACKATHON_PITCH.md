# Signal-to-Settlement: ARC Market Intelligence Agent

---

## One-Liner

An AI agent that reads macro and crypto market signals, makes deterministic treasury decisions, and settles them on Arc Testnet — with a full audit trail on every action.

---

## Problem

AI agents operating with treasury access face three unresolved problems:

1. **No decision discipline.** Most agent demos hardcode amounts or use random logic. There is no principled, auditable path from market conditions to a treasury action.

2. **No settlement accountability.** Agents that "execute trades" rarely produce verifiable on-chain evidence. There is no tx hash, no block number, no rationale attached to the action.

3. **No risk controls.** Agents either always act or never act. There is no deterministic guard that says: *this regime does not justify moving funds*.

These problems matter more when agents control real treasury capital, even small amounts. A demo that papers over them is not infrastructure — it is theater.

---

## Solution

**Signal-to-Settlement** is a market intelligence settlement agent that converts regime-classified signals into controlled, auditable treasury actions on Arc.

The agent does not predict markets. It detects regime conditions from structured signals, applies a deterministic decision policy, and routes the result to the appropriate settlement provider.

Every output is auditable: the regime, the decision, the rationale, the risk controls applied, and — when a transaction is warranted — the tx hash, block number, and explorer link. When no transaction is warranted, the report explains exactly why.

---

## Why This Matters for AI Agents

The dominant pattern in AI agent systems today is: *call an LLM, get an action, execute it.* This is fast to demo and dangerous to deploy.

What is missing is the layer between intelligence and execution: a **deterministic policy engine** that translates probabilistic signal outputs into bounded, explainable actions.

Signal-to-Settlement demonstrates this layer working end to end:

- Signals in → regime classification → policy evaluation → settlement decision → on-chain execution → markdown audit report
- No LLM magic in the execution path. Every rule is readable in `decisionPolicy.ts`.
- No transaction is sent without passing a chain ID check, a confidence threshold, and a regime-appropriate policy gate.

This is what treasury infrastructure for AI agents should look like: not a bot, but a disciplined settlement layer with embedded risk controls.

---

## Why Arc

Arc provides the execution layer this architecture requires:

- **Programmable finality.** Settlement on Arc Testnet produces real tx hashes and block numbers that go directly into the audit report.
- **Agent-native infrastructure.** Arc is a strong fit for agent-driven treasury operations because it provides fast, programmable settlement and a Circle-aligned stablecoin infrastructure surface.
- **Circle integration surface.** Based on Circle documentation, Arc Testnet is supported across Agent Wallets (`ARC-TESTNET`), Gateway (domain ID 26), CCTP V2 (domain ID 26), and x402 nanopayments via Gateway — creating a clear path from this MVP toward stablecoin-native agent settlement.
- **ChainId enforcement.** The settlement provider hardcodes `chainId === 5042002n` as a pre-flight check. This is not optional configuration — it is a safety invariant.

Arc is not the demo environment. It is the settlement target the architecture is built for.

---

## Why Circle

Circle provides the stablecoin infrastructure that makes agent treasury operations production-viable. The project is designed around Circle's Arc Testnet capabilities:

| Integration | Status | Notes |
|---|---|---|
| **Agent Wallets** (`ARC-TESTNET`) | Documented, provider architecture ready | Programmatic SDK integration deferred to post-MVP |
| **Gateway** (domain 26, `arcTestnet`) | Documented, adapter planned | API credentials not yet provisioned |
| **CCTP V2** (domain 26) | Documented, contract addresses verified | Standard Transfer only — Fast Transfer not available from Arc |
| **x402 / nanopayments** | Documented | Requires Gateway USDC deposit; packages not yet installed |

**What is accurate and what is not overclaimed:**
- Agent Wallet **spending policies** are not available on Arc Testnet. They are a mainnet-only feature. This project does not claim otherwise.
- CCTP **Fast Transfer** is not available from Arc Testnet. Standard Transfer only.
- x402 nanopayments require a prior USDC deposit to Circle Gateway. This is documented, not papered over.

The Circle integration path is architecturally mapped and ready to activate. It is not presented as live because it is not live yet.

---

## Architecture

```
data/signals.json  (or  data/demo/signals-*.json)
        │
        ▼
┌───────────────────┐
│   Signal Engine   │  classifySignal() per signal
│  signalEngine.ts  │  → riskScore, opportunityScore, confidence
│                   │  → getMarketRegime()
│                   │  → regime: risk-off | neutral | risk-on
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Decision Engine  │  evaluatePolicy(regime)
│ decisionEngine.ts │  → deterministic rule evaluation (6 rules)
│ decisionPolicy.ts │  → action, amount, rationale[], riskControls[]
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Settlement Router │  route(request) → dispatch to provider
│settlementProvider │
│      .ts          │  ┌─────────────────────────────────────┐
│                   │  │ ArcNativeSettlementProvider [DEFAULT]│
│                   │  │  • verify chainId === 5042002n       │
│                   │  │  • ethers v6 wallet                  │
│                   │  │  • retry logic (3 attempts)          │
│                   │  │  • 45s confirmation timeout          │
│                   │  │  • returns txHash + blockNumber      │
│                   │  └─────────────────────────────────────┘
│                   │  ┌─────────────────────────────────────┐
│                   │  │ MockSettlementProvider [OPTIONAL]    │
│                   │  │  • simulated tx, no real funds       │
│                   │  └─────────────────────────────────────┘
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Decision Report  │  saveDecisionReport()
│ decisionReport.ts │  → markdown with regime, action, rationale,
│                   │    risk controls, tx hash, block, explorer link
│                   │    or: clear explanation of why no tx was sent
└───────────────────┘
         │
         ▼
   reports/arc-decision-report-*.md
```

**Stack:** Node.js, TypeScript (strict), ethers v6, dotenv, zod, better-sqlite3  
**Runtime:** CommonJS + tsx  
**Chain:** Arc Testnet | chainId 5042002 | RPC: https://rpc.testnet.arc.network  
**Explorer:** https://testnet.arcscan.app

---

## What Works Today

All of the following have been validated with live Arc Testnet transactions:

- ✅ Signal Engine classifies signals as structural / tactical / speculative
- ✅ Signal Engine calculates riskScore, opportunityScore, confidence per signal
- ✅ Signal Engine detects regime: `risk-off` / `neutral` / `risk-on`
- ✅ Decision Engine applies deterministic 6-rule policy — no LLM in execution path
- ✅ `SettlementRouter` dispatches to the correct provider
- ✅ `ArcNativeSettlementProvider` verifies chainId `5042002n` before every transaction
- ✅ Live settlement confirmed on Arc Testnet (multiple tx hashes, multiple blocks)
- ✅ Hold behavior confirmed: risk-off regime produces no transaction with full rationale
- ✅ Reports generated with tx hash, block number, explorer link, rationale, risk controls
- ✅ Three demo scenarios runnable from a single command each
- ✅ TypeScript strict mode, zero typecheck errors

---

## Demo Flow

Three commands demonstrate three distinct agent behaviors:

### `npm run demo:risk-off` — Hold

```
Signals:  Geopolitical escalation, oil shock, institutional deleveraging
Regime:   risk-off
Decision: hold
Amount:   0 ETH — no transaction sent
Report:   Explains why no tx was sent. Risk controls listed.
```

The agent detects elevated systemic risk, confidence is present but below the 75/100 threshold required to act in a risk-off regime. Position held. Funds untouched. Report documents the reasoning.

---

### `npm run demo:neutral` — Settle Small

```
Signals:  Stable funding rates, mixed macro data, no dominant regime signal
Regime:   neutral
Decision: settle-small
Amount:   0.002 ETH
TX:       confirmed on Arc Testnet
Report:   tx hash, block number, arcscan.app link
```

Neutral market conditions allow cautious treasury participation. The agent sends a minimal transfer, confirms on-chain, and records the full audit trail.

---

### `npm run demo:risk-on` — Settle Normal

```
Signals:  Prediction market surge, liquidity inflow, strong sector rotation
Regime:   risk-on
Decision: settle-normal
Amount:   0.005 ETH
TX:       confirmed on Arc Testnet
Report:   tx hash, block number, arcscan.app link
          opportunity/risk ratio validated in rationale
```

Strong conviction in a risk-on environment satisfies all policy gates: confidence ≥ 75, opportunity score exceeds risk score. Normal settlement executed. Audit trail complete.

---

## Safety and Risk Controls

Safety is not a feature — it is an architectural constraint. Every settlement path enforces the following:

| Control | Implementation |
|---|---|
| **Chain ID guard** | `network.chainId !== 5042002n` → throw before any transaction |
| **Hold gate** | Actions `hold` and `request-more-intelligence` return `status: held` — no tx dispatched |
| **Confidence threshold** | `avgConfidence < 50` → `request-more-intelligence`, no tx |
| **Risk-off discipline** | `risk-off + confidence < 75` → `hold`, no tx |
| **Opportunity gate (risk-on)** | `opportunityScore > riskScore` required for `settle-normal` |
| **Amount ceiling** | Max `0.005 ETH` in current policy; no dynamic amount scaling |
| **Retry cap** | Max 3 retries on `txpool full`; exponential backoff |
| **Confirmation timeout** | 45s timeout; returns `status: failed` with partial tx hash if exceeded |
| **Private key isolation** | Keys read from `data/wallets.json` at runtime; never hardcoded |
| **Provider availability check** | `isAvailable()` called before every dispatch |
| **No fake transactions** | Circle providers are not implemented; there are no simulated Circle txs presented as real |

---

## What Is Not Implemented Yet

This section exists because honesty about scope is part of the architecture philosophy.

| Feature | Status |
|---|---|
| Circle Agent Wallet programmatic transfer | Documented in `docs/CIRCLE_INTEGRATION_DECISION.md`. Provider skeleton ready. SDK not yet integrated. |
| Circle Gateway USDC transfer | Documented. Config validation present. API credentials not provisioned. |
| CCTP V2 cross-chain transfer | Contract addresses verified and documented. Burn/attest/mint flow not implemented. |
| x402 nanopayments | Documented. Packages not installed. Requires Gateway USDC deposit. |
| Agent Wallet spending policies | Not available on Arc Testnet (Circle limitation). Will not be claimed until mainnet. |
| Signal ingestion from live sources | Current implementation reads static JSON. Live feed adapter is not built. |
| Multi-agent coordination | Single treasury agent. Multi-agent orchestration is not in scope for this MVP. |
| Database audit log | `better-sqlite3` is a dependency but not yet used. SQLite audit trail is a planned next step. |

---

## Roadmap

### Phase 1 — MVP (current)
- Signal Engine + Decision Engine + Arc Native Settlement ✅
- Three demo scenarios with live on-chain confirmation ✅
- Full markdown audit report per run ✅

### Phase 2 — Circle USDC Settlement
- Integrate `@circle-fin/developer-controlled-wallets` for Agent Wallet transfer
- Register `CircleAgentWalletProvider` in the settlement router
- Decision Engine selects USDC asset when Circle provider is active

### Phase 3 — Cross-Chain and Nanopayments
- CCTP V2 Standard Transfer: burn on Arc → attest via Iris API → mint on destination
- x402 nanopayments via Gateway for micro-scale agent service payments
- Gateway USDC deposit management

### Phase 4 — Live Signal Ingestion
- Replace static `signals.json` with a live signal adapter (REST, WebSocket, or oracle)
- Add SQLite audit log for persistent decision history
- Signal schema validation with zod

### Phase 5 — Multi-Agent Treasury
- Multi-role agent coordination (treasury, risk manager, auditor)
- Spending policy integration when available on Arc mainnet
- Agent wallet authorization tiers

---

## Judge-Friendly Summary

**What it is:**  
A settlement agent that reads structured market signals, classifies them into a regime, applies a deterministic policy, and executes the appropriate treasury action on Arc Testnet — with a verifiable audit trail on every run.

**What makes it different:**  
It does not claim to predict markets, execute complex strategies, or integrate Circle infrastructure that isn't actually working. It demonstrates one well-defined loop — signal to settlement — with real on-chain evidence and a clear explanation of every decision made or withheld.

**What the code shows:**  
- A deterministic policy engine that is readable, testable, and auditable
- ChainId-enforced settlement that cannot silently operate on the wrong chain
- A provider architecture that is ready for Circle USDC integration without requiring it now
- Three runnable demo scenarios that each produce a different agent behavior and a different on-chain outcome

**Why it matters:**  
Most AI agent demos show that agents *can* make decisions. This one shows that agents *can be made accountable* for them. That distinction matters when agents control treasury capital.

**Three commands. Three regimes. Three behaviors. All verifiable.**

```bash
npm run demo:risk-off   # hold — no transaction, full rationale
npm run demo:neutral    # settle-small — 0.002 ETH, confirmed on Arc
npm run demo:risk-on    # settle-normal — 0.005 ETH, confirmed on Arc
```

---

*Arc Testnet | Chain ID: 5042002 | Explorer: https://testnet.arcscan.app*  
*Repository: arc-macro-agent-lab*  
*Stack: Node.js · TypeScript · ethers v6 · Arc Testnet · Circle-ready*
