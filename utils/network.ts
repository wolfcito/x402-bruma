export type NetworkString = string;

const sanitize = (value: string) =>
  value.trim().toLowerCase().replace(/\s+|_/g, "-");

export const normalizeNetwork = (
  value: string | null | undefined,
): NetworkString | null => {
  if (!value) {
    return null;
  }
  const t = sanitize(value);

  // Avalanche
  if (
    [
      "43113",
      "fuji",
      "avax-fuji",
      "avalanche-fuji",
      "avalanche-fuji-testnet",
      "avalanche-testnet",
    ].includes(t)
  ) {
    return "avalanche-fuji";
  }
  if (
    ["43114", "avax", "c-chain", "avalanche", "avalanche-mainnet"].includes(t)
  ) {
    return "avalanche";
  }

  // Base
  if (["base", "8453"].includes(t)) {
    return "base";
  }
  if (["base-sepolia", "84532", "base-testnet"].includes(t)) {
    return "base-sepolia";
  }

  // Polygon
  if (["polygon", "137"].includes(t)) {
    return "polygon";
  }
  if (["polygon-amoy", "80002", "amoy"].includes(t)) {
    return "polygon-amoy";
  }

  // Celo
  if (["celo"].includes(t)) {
    return "celo";
  }
  if (["celo-sepolia"].includes(t)) {
    return "celo-sepolia";
  }

  // Optimism / Arbitrum / Unichain
  if (["optimism"].includes(t)) {
    return "optimism";
  }
  if (["optimism-sepolia"].includes(t)) {
    return "optimism-sepolia";
  }
  if (["arbitrum"].includes(t)) {
    return "arbitrum";
  }
  if (["arbitrum-sepolia"].includes(t)) {
    return "arbitrum-sepolia";
  }
  if (["unichain"].includes(t)) {
    return "unichain";
  }
  if (["unichain-sepolia"].includes(t)) {
    return "unichain-sepolia";
  }

  // Abstract
  if (["abstract-testnet"].includes(t)) {
    return "abstract-testnet";
  }
  if (["abstract"].includes(t)) {
    return "abstract";
  }

  // Solana
  if (["solana", "mainnet-beta"].includes(t)) {
    return "solana";
  }
  if (["solana-devnet", "devnet"].includes(t)) {
    return "solana-devnet";
  }

  // Misc networks surfaced by facilitators
  if (["ethereum", "ethereum-sepolia"].includes(t)) {
    return t;
  }
  if (
    [
      "hyperevm",
      "hyperevm-testnet",
      "iotex",
      "peaq",
      "sei",
      "sei-testnet",
    ].includes(t)
  ) {
    return t;
  }

  return null;
};
