import dotenv from "dotenv";

dotenv.config();

export const config = {
  rpcUrl: process.env.ARC_RPC_URL || "",
  chainId: Number(process.env.ARC_CHAIN_ID || 0),
};