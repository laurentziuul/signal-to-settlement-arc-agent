# Signal-to-Settlement: ARC Market Intelligence Agent

> Agora / ARC Agent Hackathon submission  
> A policy-controlled market agent for Arc Testnet.

---

## One-Liner

**Signal-to-Settlement converts macro/crypto regime signals into risk-gated treasury actions on Arc Testnet and produces an audit trail for both execution and no-action decisions.**

> Arc gives agents the ability to move money.  
> Signal-to-Settlement adds the policy and audit layer that decides when money should move — and records why.

---

## Core Thesis

As agent wallets become treasuries, execution is not enough.

Market agents need:

- policy before settlement
- risk controls before money moves
- decision receipts, not just transaction receipts
- auditable explanations for both action and inaction

The core idea:

> **An accountable market agent must justify both action and inaction.**

This project is not positioned as a trading bot. It is a settlement-policy prototype for market-aware agents that may eventually control treasury flows.

---

## Links

- **Repository:** https://github.com/laurentziuul/signal-to-settlement-arc-agent
- **Demo:** https://www.youtube.com/watch?v=VO0Sf-4URSQ
- **Arc Testnet Explorer:** https://testnet.arcscan.app

---

## What It Does

Signal-to-Settlement follows a simple pipeline:

1. **Signal Engine** reads structured market signals, classifies them as structural / tactical / speculative, and scores each for risk, opportunity, and confidence.
2. **Regime Detection** aggregates scores into one of three market states: `risk-off`, `neutral`, or `risk-on`.
3. **Decision Engine** applies a deterministic 6-rule policy — no LLM in the execution path — and outputs an action with amount, rationale, and risk controls.
4. **Settlement Router** dispatches the action to `ArcNativeSettlementProvider`, which verifies `chainId === 5042002n` before sending any transaction.
5. **Audit Report** is saved to `reports/` with the regime, decision rationale, risk controls, tx hash, block number, and explorer link — or a clear explanation of why no transaction was sent.

---

## Decision Flow

```text
Market signals
      ↓
Signal classification
      ↓
Regime interpretation
      ↓
Risk / opportunity / confidence scoring
      ↓
Policy gate
      ↓
Treasury action or no-action
      ↓
Arc Testnet settlement, if allowed
      ↓
Markdown audit report
```

Current policy behavior:

| Market Regime | Agent Decision | Treasury Action |
|---|---|---|
| `risk-off` | Preserve capital | Hold / no transaction |
| `neutral` | Limited execution | Settle-small |
| `risk-on` | Controlled execution | Settle-normal |
| Defensive branch | Reduce risk / require caution | Settle-defensive or no-action depending on policy conditions |

---

## Why Arc

Arc is used as the settlement layer for controlled agent treasury actions.

Signal-to-Settlement explores what happens **before** an agent-controlled wallet moves funds:

- what market signals were considered
- what risk policy was applied
- whether execution was allowed
- what action was settled on Arc Testnet
- what audit trail remains afterward

Arc provides the execution layer.  
Signal-to-Settlement focuses on the decision, policy, and audit layer before execution.

---

## What Gets Audited

Every agent run produces a human-readable audit report that records:

- input signal file
- detected market regime
- confidence score
- risk score
- opportunity score
- selected treasury action
- rationale for execution or no-action
- risk controls applied
- transaction hash, block number, and explorer link when settlement occurs
- explicit no-transaction rationale when settlement is blocked

The goal is not only to prove that a transaction happened.

The goal is to explain **why the agent decided that money should move — or why it should not.**

---

## What Works Today

- ✅ Signal classification and regime detection
- ✅ Deterministic decision policy: hold / settle-small / settle-normal / settle-defensive
- ✅ Live settlement on Arc Testnet with confirmed tx hashes and block numbers
- ✅ Hold behavior: risk-off regime produces no transaction and a full rationale report
- ✅ Three runnable demo scenarios, each producing a different outcome
- ✅ Markdown audit report per run
- ✅ TypeScript strict mode, zero typecheck errors
- ✅ Chain ID guard before transaction execution

---

## Quick Demo

```bash
npm install
npm run typecheck

# Three regimes, three behaviors
npm run demo:risk-off    # hold — no transaction sent
npm run demo:neutral     # settle-small — 0.002 ETH confirmed on Arc
npm run demo:risk-on     # settle-normal — 0.005 ETH confirmed on Arc

# Default run using live signals.json
npm run scenario:decision
```

Reports are saved to `reports/` after each run.  
Explorer: https://testnet.arcscan.app

> Note: `demo:neutral`, `demo:risk-on`, and `scenario:decision` send live Arc Testnet transactions.  
> `demo:risk-off` is the safety path and sends no transaction.

---

## Example Verified Runs

- Default decision scenario: `settle-small` — https://testnet.arcscan.app/tx/0x0f98724041ea9ab8211f7b104f60f9c051f45659be6ed2e966bedb0c7be91f59
- Neutral demo: `settle-small` — https://testnet.arcscan.app/tx/0x7292e4827702af04688a3ea4a49c6c3d59801e95eed7a99aeedbba12bccc941e
- Risk-on demo: `settle-normal` — https://testnet.arcscan.app/tx/0xd9f232df2de042fcd661b4f7dadf69c58fc781c6a8899493bd44bebd12f34577
- Risk-off demo: `hold` — no transaction sent; see generated report in `reports/`

---

## Safety Controls

| Control | Behavior |
|---|---|
| Chain ID guard | Rejects any transaction if `chainId !== 5042002n` |
| Hold gate | `hold` and `request-more-intelligence` actions send no transaction |
| Confidence threshold | `avgConfidence < 50` → no action |
| Risk-off discipline | `risk-off + confidence < 75` → hold, no transaction |
| Opportunity gate | `risk-on` requires `opportunityScore > riskScore` |
| Amount ceiling | Max `0.005 ETH` in current policy |
| Deterministic execution path | No LLM is used in the transaction execution path |
| No fake transactions | Circle providers are not live; no simulated Circle txs are presented as real |

---

## Architecture

```text
data/signals.json
  → Signal Engine
      classify + score + regime detection
  → Decision Engine
      deterministic policy in decisionPolicy.ts
  → Settlement Router
      dispatch to provider
  → ArcNativeSettlementProvider
      chainId check → ethers v6 tx → confirmation
  → reports/arc-decision-report-*.md
```

**Stack:** Node.js · TypeScript strict mode · ethers v6 · Arc Testnet  
**Arc chain ID:** `5042002`  
**Signal inputs:** `data/signals.json` default or `data/demo/signals-*.json`  
**Wallet config:** `data/wallets.json` with role-based wallets: treasury, agent, merchant

---

## Design Principles

| Principle | Implementation |
|---|---|
| Policy before settlement | The decision engine must approve the action before funds move |
| Action and inaction are both first-class | `hold` is treated as a valid decision, not a failed run |
| Determinism in execution | No LLM is placed in the transaction path |
| Auditability | Every run creates a markdown report |
| Safety over demo theatrics | Risk-off scenarios intentionally send no transaction |
| Arc-native settlement check | Chain ID is verified before execution |

---

## Documentation

- [`docs/HACKATHON_PITCH.md`](docs/HACKATHON_PITCH.md) — full project narrative, architecture diagram, demo flow, safety controls, roadmap
- [`docs/CIRCLE_INTEGRATION_DECISION.md`](docs/CIRCLE_INTEGRATION_DECISION.md) — Circle integration findings, contract addresses, limitations, next steps

---

## Current Limitations

- Circle providers such as Agent Wallets, Gateway, CCTP, and x402 are **documented but not yet live** in this prototype
- Agent Wallet spending policies are **not available on Arc Testnet** in the current implementation path
- CCTP Fast Transfer is **not available from Arc** — Standard Transfer only
- Signal input is static JSON; live feed adapter is not yet built
- SQLite audit log is planned; `better-sqlite3` is installed but not yet used
- Current settlement amounts are small testnet-native amounts, not production treasury values

---

## Roadmap

| Phase | Scope |
|---|---|
| **1 — MVP** ✅ | Signal Engine · Decision Engine · Arc Native Settlement · Demo scenarios |
| **2 — Circle USDC** | Agent Wallet programmatic transfer · USDC settlement path |
| **3 — Cross-chain** | CCTP V2 Standard Transfer · x402 nanopayments via Gateway |
| **4 — Live signals** | Live signal adapter · SQLite audit log · zod schema validation |
| **5 — Multi-agent** | Multi-role coordination · mainnet spending policies |

---

## Submission Summary

Signal-to-Settlement demonstrates a market-aware agent that does not simply execute transactions.

It reads structured market signals, classifies the regime, applies a deterministic policy, decides whether a treasury action is justified, settles on Arc Testnet when allowed, and records the reasoning behind both execution and no-action outcomes.

The project explores a core problem for agentic finance:

> Once agents can move money, how do we make their financial actions controlled, explainable, and auditable?
