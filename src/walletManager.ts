import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { provider } from "./arcClient";

const walletsPath = path.join(process.cwd(), "data", "wallets.json");
const ARC_TESTNET_CHAIN_ID = 5042002n;

type StoredWallet = {
  id: string;
  role: string;
  address: string;
  privateKey: string;
  createdAt: string;
};

function ensureDataFile() {
  const dataDir = path.join(process.cwd(), "data");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  if (!fs.existsSync(walletsPath)) {
    fs.writeFileSync(walletsPath, JSON.stringify([], null, 2));
  }
}

function readWallets(): StoredWallet[] {
  ensureDataFile();
  const raw = fs.readFileSync(walletsPath, "utf-8");
  return JSON.parse(raw);
}

function writeWallets(wallets: StoredWallet[]) {
  fs.writeFileSync(walletsPath, JSON.stringify(wallets, null, 2));
}

export function createTestnetWallet(role = "agent") {
  const wallet = ethers.Wallet.createRandom();

  const storedWallet: StoredWallet = {
    id: `wallet-${Date.now()}`,
    role,
    address: wallet.address,
    privateKey: wallet.privateKey,
    createdAt: new Date().toISOString(),
  };

  const wallets = readWallets();
  wallets.push(storedWallet);
  writeWallets(wallets);

  console.log("New ARC testnet wallet created");
  console.log("Role:", storedWallet.role);
  console.log("Address:", storedWallet.address);
  console.log("Saved to:", walletsPath);
  console.log("");
  console.log("IMPORTANT:");
  console.log("This is a TESTNET wallet only.");
  console.log("Do not use it with real funds.");

  return storedWallet;
}

export async function showWalletBalances() {
  const wallets = readWallets();

  if (wallets.length === 0) {
    console.log("No wallets found. Create one first.");
    return;
  }

  console.log("Wallet balances on ARC Testnet:");
  console.log("");

  for (const wallet of wallets) {
    const balance = await provider.getBalance(wallet.address);

    console.log("ID:", wallet.id);
    console.log("Role:", wallet.role);
    console.log("Address:", wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "USDC/native gas");
    console.log("---");
  }
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

export async function sendNativeUSDC(fromIndex = 0, toIndex = 1, amount = "0.01") {
  const wallets = readWallets();

  if (wallets.length < 2) {
    console.log("Need at least 2 wallets. Run npm run create-wallet twice.");
    return;
  }

  const from = wallets[fromIndex];
  const to = wallets[toIndex];

  if (!from || !to) {
    console.log("Wallet index out of range.");
    return;
  }

  await assertArcTestnet();

  const signer = new ethers.Wallet(from.privateKey, provider);

  console.log("Sending native USDC on ARC Testnet...");
  console.log("From:", from.address);
  console.log("To:", to.address);
  console.log("Amount:", amount);

  const tx = await signer.sendTransaction({
    to: to.address,
    value: ethers.parseEther(amount)
  });

  console.log("Transaction sent:");
  console.log(tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();

  console.log("Confirmed in block:", receipt?.blockNumber);
  console.log("Explorer:");
  console.log(`https://testnet.arcscan.app/tx/${tx.hash}`);
}
