# Signal-to-Settlement: ARC Market Intelligence Agent

> Agora / ARC Agent Hackathon submission

---

## One-Liner

A market-intelligence settlement agent that converts macro and crypto regime signals into controlled, auditable treasury actions on Arc Testnet.

---

## What It Does

1. **Signal Engine** reads structured market signals, classifies them as structural / tactical / speculative, and scores each for risk, opportunity, and confidence.
2. **Regime detection** aggregates scores into one of three market states: `risk-off`, `neutral`, or `risk-on`.
3. **Decision Engine** applies a deterministic 6-rule policy — no LLM in the execution path — and outputs an action with amount, rationale, and risk controls.
4. **Settlement Router** dispatches the action to `ArcNativeSettlementProvider`, which verifies `chainId === 5042002n` before sending any transaction.
5. **Audit report** is saved to `reports/` with the regime, decision rationale, risk controls, tx hash, block number, and explorer link — or a clear explanation of why no transaction was sent.

---

## What Works Today

- ✅ Signal classification and regime detection
- ✅ Deterministic decision policy (hold / settle-small / settle-normal / settle-defensive)
- ✅ Live settlement on Arc Testnet with confirmed tx hashes and block numbers
- ✅ Hold behavior: risk-off regime produces no transaction and a full rationale report
- ✅ Three runnable demo scenarios, each producing a different on-chain outcome
- ✅ Markdown audit report per run
- ✅ TypeScript strict mode, zero typecheck errors

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

> Note: `demo:neutral`, `demo:risk-on`, and `scenario:decision` send live Arc Testnet transactions. `demo:risk-off` is the safety path and sends no transaction.

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
| No fake transactions | Circle providers are not live; no simulated Circle txs are presented as real |

---

## Architecture

```
data/signals.json
  → Signal Engine       classify + score + regime detection
  → Decision Engine     deterministic policy (decisionPolicy.ts)
  → Settlement Router   dispatch to provider
  → ArcNativeSettlementProvider   chainId check → ethers v6 tx → confirm
  → reports/arc-decision-report-*.md
```

**Stack:** Node.js · TypeScript (strict) · ethers v6 · Arc Testnet (chainId 5042002)  
**Signal inputs:** `data/signals.json` (default) or `data/demo/signals-*.json`  
**Wallet config:** `data/wallets.json` (role-based: treasury, agent, merchant)

---

## Documentation

- [`docs/HACKATHON_PITCH.md`](docs/HACKATHON_PITCH.md) — full project narrative, architecture diagram, demo flow, safety controls, roadmap
- [`docs/CIRCLE_INTEGRATION_DECISION.md`](docs/CIRCLE_INTEGRATION_DECISION.md) — Circle integration findings, contract addresses, limitations, next steps

---

## Current Limitations

- Circle providers (Agent Wallets, Gateway, CCTP, x402) are **documented but not yet live**
- Agent Wallet spending policies are **not available on Arc Testnet** (Circle mainnet-only feature)
- CCTP Fast Transfer is **not available from Arc** — Standard Transfer only
- Signal input is static JSON; live feed adapter not yet built
- SQLite audit log is a planned feature (`better-sqlite3` is installed, not yet used)

---

## Roadmap

| Phase | Scope |
|---|---|
| **1 — MVP** ✅ | Signal Engine · Decision Engine · Arc Native Settlement · Demo scenarios |
| **2 — Circle USDC** | Agent Wallet programmatic transfer · USDC settlement path |
| **3 — Cross-chain** | CCTP V2 Standard Transfer · x402 nanopayments via Gateway |
| **4 — Live signals** | Live signal adapter · SQLite audit log · zod schema validation |
| **5 — Multi-agent** | Multi-role coordination · mainnet spending policies |
