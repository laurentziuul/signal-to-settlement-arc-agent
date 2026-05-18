# AGENTS.md — arc-macro-agent-lab

## Role

Act as a strict reviewer/tester for this repo unless explicitly asked to implement.

This is a hackathon MVP:
Signal Engine -> Decision Engine -> SettlementRouter -> Arc Native Settlement -> Markdown Report.

Do not turn this into a large framework. Prefer small, safe, testable patches.

## Stack

- Node.js
- TypeScript
- ethers v6
- dotenv
- zod
- better-sqlite3
- CommonJS package
- tsx runtime

## Arc Testnet

- RPC: https://rpc.testnet.arc.network
- Chain ID: 5042002
- Explorer: https://testnet.arcscan.app

## Existing commands

Run relevant commands before claiming success:

```bash
npm run typecheck
npm run scenario:basic
npm run scenario:decision
```

Use this only when needed and safe:

```bash
npm run balances
```

## Current architecture

Preserve the existing flat `src/` layout unless explicitly asked otherwise.

Important files:

- `src/signalEngine.ts`
- `src/scenarioRunner.ts`
- `src/report.ts`
- `src/walletManager.ts`
- `src/decisionScenario.ts`
- `src/decisionEngine.ts`
- `src/decisionPolicy.ts`
- `src/settlementProvider.ts`
- `src/decisionReport.ts`
- `package.json`
- `tsconfig.json`

## Safety rules

- Never hardcode private keys.
- Never print full private keys, seed phrases, `.env` contents, or wallet private data.
- Do not modify `data/wallets.json`.
- Do not modify `wallets.json`.
- Do not modify `data/signals.json` unless explicitly asked for a temporary test, and revert it afterward.
- Do not send transactions unless the user explicitly asks or the requested scenario command already sends testnet transactions.
- Confirm Arc chainId `5042002` before any transaction.
- Do not implement Circle providers unless explicitly asked.
- Do not fake Circle transactions.
- Do not claim Circle Agent Wallet spending policies work on Arc Testnet.
- Keep patches minimal.
- Do not rewrite working files without a clear bug.

## Circle facts

- Agent Wallets support Arc Testnet with chain identifier `ARC-TESTNET`.
- Gateway supports Arc Testnet.
- Gateway Arc Testnet domain ID: `26`.
- Gateway chainName: `arcTestnet`.
- Arc Testnet USDC address: `0x3600000000000000000000000000000000000000`.
- CCTP V2 supports Arc Testnet.
- CCTP Arc Testnet domain ID: `26`.
- CCTP from Arc is Standard Transfer only.
- Fast Transfer is not available from Arc.
- x402/nanopayments are supported on Arc Testnet through Gateway.
- x402 gas-free nanopayments require a Gateway USDC deposit.

## Review priorities

For review tasks:

- Inspect diffs first.
- Check `tsconfig.json`, `package.json`, `src/index.ts`, and `src/walletManager.ts`.
- Verify old flow still works.
- Verify new decision flow works.
- Verify hold actions do not send transactions.
- Verify chainId check happens before sending transactions.
- Verify generated reports include:
  - regime
  - confidence
  - riskScore
  - opportunityScore
  - decision action
  - provider
  - asset
  - amount
  - rationale
  - risk controls
  - tx hash/block/status or no-tx reason
- Report exact commands run and outputs.

## TypeScript expectations

- Keep TypeScript strict.
- Preserve CommonJS / tsx compatibility.
- Avoid top-level await.
- Avoid unnecessary new dependencies.
- If adding a dependency is necessary, explain why.
- Do not weaken `tsconfig.json` without a clear reason.

## Communication

- Respond to Laurentiu in Romanian.
- Keep code, filenames, CLI commands, logs, npm scripts, and identifiers in English.
