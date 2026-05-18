import { ethers } from "ethers";
import { config } from "./config";

export const provider = new ethers.JsonRpcProvider(
  config.rpcUrl,
  config.chainId
);

export async function testConnection() {
  console.log("Connecting to ARC RPC...");

  const network = await provider.getNetwork();
  console.log("Network name:", network.name);
  console.log("Chain ID:", network.chainId.toString());

  const blockNumber = await provider.getBlockNumber();

  console.log("Connected to ARC Testnet");
  console.log("Latest block:", blockNumber);
}