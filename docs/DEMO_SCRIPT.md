# Demo Script — Signal-to-Settlement / ARC Market Intelligence Agent

> Agora / ARC Agent Hackathon | Target: 2 minutes

---

## 2-Minute Spoken Script

---

**[0:00 — 0:15] Opening**

"Most AI agent demos show that an agent can take action.
This one shows that an agent can be made accountable for its actions.

Signal-to-Settlement is a market-intelligence settlement agent.
It reads structured market signals, detects the current regime,
and makes a deterministic treasury decision — with a full audit trail on Arc."

---

**[0:15 — 0:35] The problem it solves**

"The gap in most agent systems is between intelligence and execution.
An LLM can summarize a market situation. But who decides whether to move funds?
How much? Under what conditions? And how do you prove it happened?

This project puts a deterministic policy engine in that gap.
Every action is explainable. Every settlement is on-chain. Every report documents why."

---

**[0:35 — 0:55] Demo: risk-off — safety path**

*[Run: `npm run demo:risk-off`]*

"I'll start with the safety path.

The signals here describe geopolitical escalation, oil shock, institutional deleveraging.
The regime comes out as risk-off.
Confidence is present — but below the 75-point threshold required to act in a risk-off environment.

The agent holds. No transaction is sent.
The report explains exactly why: regime, confidence score, risk controls applied.

This is deliberate. A good settlement agent knows when not to act."

---

**[0:55 — 1:20] Demo: risk-on — live settlement**

*[Run: `npm run demo:risk-on`]*

"Now the opposite scenario.

Prediction market surge, liquidity inflow, strong sector rotation.
Regime: risk-on. Confidence above 75. Opportunity score exceeds risk score.
All three policy gates pass.

The agent sends 0.005 ETH from treasury to agent wallet on Arc Testnet.
Watch: it verifies chain ID 5042002 before the transaction.
TX submitted. Confirmed.

The report records the tx hash, block number, and a direct explorer link."

---

**[1:20 — 1:40] What makes this different**

"Three things I want to highlight.

First: the decision path is deterministic. Six rules in one file — `decisionPolicy.ts`.
No LLM decides whether to move funds. The policy is readable, testable, auditable.

Second: the chain ID is enforced in code, not configuration.
The provider throws if it's not talking to Arc Testnet. Silent mis-routing is not possible.

Third: every run produces a markdown report.
Regime detected, decision made, rationale, risk controls, settlement result.
If no transaction was sent, the report explains why."

---

**[1:40 — 2:00] Circle path and close**

"The architecture is already mapped for Circle integration.
Agent Wallets on ARC-TESTNET, Gateway on domain 26, CCTP V2, x402 nanopayments.
These are documented and ready to activate — not live yet, not claimed as live.

The foundation is a disciplined settlement layer.
Signal to decision to settlement to audit.
All verifiable on Arc Testnet.

Thank you."

---

---

## Terminal Demo Checklist

### Before you start

- [ ] Terminal is open in `arc-macro-agent-lab/`
- [ ] `data/wallets.json` exists and treasury wallet has testnet funds
- [ ] Internet connection is stable (Arc Testnet RPC)
- [ ] Close unnecessary applications — clean terminal is cleaner on screen

### Command sequence

```bash
# 1. Run risk-off first — proves safety path, no tx needed
npm run demo:risk-off
```

**Point out in output:**
- `Regime: risk-off`
- `Decision: hold`
- `⏸  HELD — No transaction sent`
- `Reason: Risk-off regime detected...`
- Report path printed at end

```bash
# 2. Run risk-on — proves live settlement
npm run demo:risk-on
```

**Point out in output:**
- `Regime: risk-on`
- `Decision: settle-normal`
- `[ArcNative] Chain verified: 5042002`
- `TX submitted: 0x...`
- `Confirmed in block: ...`
- `✅ SETTLED`
- Explorer link
- Report path printed at end

```bash
# 3. Optional — only if time allows
npm run demo:neutral
```

### What NOT to run

- Do not run `npm run scenario:basic` — that is a separate older scenario, confusing in context
- Do not run `npm run send` — that is a raw transfer without decision logic
- Do not run `npm run balances` unless asked about wallet state

### After each run

Open the generated report in `reports/` and briefly show the markdown structure:
- Executive Summary (regime, confidence, decision)
- Rationale bullets
- Risk Controls bullets
- Settlement Result (tx hash + block, or held explanation)
- Pipeline section showing the signals file used

---

## Backup Plan — If Live RPC Fails

If Arc Testnet RPC is unresponsive during the demo:

**Step 1 — Show existing reports**

Open any recent file in `reports/`:
- `arc-decision-report-*.md` — shows a full decision audit trail
- Point out: regime, rationale, risk controls, tx hash, block number, explorer link

**Step 2 — Show verified tx links from README**

Open `README.md`, section **Example Verified Runs**:

```
Default scenario:  settle-small  — 0x0f98724041ea9ab8211f7b104f60f9c051f45659be6ed2e966bedb0c7be91f59
Neutral demo:      settle-small  — 0x7292e4827702af04688a3ea4a49c6c3d59801e95eed7a99aeedbba12bccc941e
Risk-on demo:      settle-normal — 0xd9f232df2de042fcd661b4f7dadf69c58fc781c6a8899493bd44bebd12f34577
Risk-off demo:     hold          — no transaction sent
```

Open https://testnet.arcscan.app and paste any of the hashes above.
The on-chain evidence is already there regardless of RPC availability.

**Step 3 — Walk through source code instead**

- `src/decisionPolicy.ts` — show the 6 rules, explain each in one sentence
- `src/settlementProvider.ts` — show the `chainId === 5042002n` check
- `src/decisionReport.ts` — show how the audit report is built

**Key message if RPC fails:**
"The prior runs are already confirmed on-chain. Here are the tx hashes.
The code that produced them is in the repo. The demo shows the system's logic, not just a one-time result."

---

## One-Slide Summary

**Signal-to-Settlement — ARC Market Intelligence Agent**

- Reads structured market signals → classifies regime → applies deterministic policy
- Three regimes, three behaviors: `risk-off` holds, `neutral` settles small, `risk-on` settles normal
- Every decision is auditable: rationale, risk controls, tx hash, block, explorer link on Arc
- Chain ID `5042002` is enforced in code before every transaction — wrong-chain execution is rejected before signing.
- Circle integration path mapped and ready: Agent Wallets, Gateway, CCTP V2, x402 — not live yet, not claimed as live

---

## Judge Q&A Prep

**Is this a trading bot?**
> No. It does not execute trades, manage positions, or interact with any exchange or DeFi protocol. It is a treasury settlement agent. It moves small amounts between role-based wallets based on a regime-classified policy, and records every action with a full audit trail.

**Is the AI making subjective decisions?**
> No. The decision path is entirely deterministic. Six rules in `decisionPolicy.ts` — readable in under two minutes. The signal engine classifies inputs with keyword matching and scoring heuristics. No LLM is in the execution path.

**What is live today?**
> Signal Engine, Decision Engine, Settlement Router, and ArcNativeSettlementProvider are all live and validated. The demo scenarios are live and validated: risk-off produces a no-transaction hold path, while neutral and risk-on produce real Arc Testnet transactions with confirmed block numbers and tx hashes visible on arcscan.app.

**What is not live yet?**
> Circle providers — Agent Wallets, Gateway, CCTP V2, x402 — are documented and architecturally ready but not yet activated. No Circle transactions have been sent. This is stated explicitly in the codebase and docs.

**Why Arc?**
> Arc provides programmable, fast settlement with a Circle-aligned stablecoin infrastructure surface. It supports Agent Wallets, Gateway, CCTP V2, and x402 on testnet — which maps directly to the next phase of this project. And it gives real tx hashes and block numbers, which are the foundation of the audit trail.

**Why Circle?**
> The end goal is USDC-native agent settlement, not native token transfers. Circle's stablecoin infrastructure — Agent Wallets on ARC-TESTNET, Gateway, CCTP V2 Standard Transfer — is the production path from this MVP. The architecture is built around that integration, even though Circle providers are not active yet.

**What prevents wrong-chain transactions?**
> `ArcNativeSettlementProvider` reads `eth_chainId` directly from the RPC and compares it to the hardcoded Arc Testnet chain ID `5042002`. If it does not match, the provider throws before sending any transaction. This is a code-level invariant, not a configuration option.

**What happens in risk-off?**
> The agent evaluates confidence against a 75-point threshold. If the regime is `risk-off` and confidence is below 75, the action is `hold`. No transaction is dispatched. The settlement router receives the hold action and returns `status: held`. The audit report documents the regime, the confidence score, the rationale, and the risk controls applied — with an explicit statement that no funds were moved.
