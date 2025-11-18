import { avalanche, avalancheFuji } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage } from "wagmi";

const DEFAULT_PROJECT_ID = "1752dca96cdc7b5701287bb6996a2841";

export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID ?? DEFAULT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_PROJECT_ID is required for Reown AppKit.");
}

export const networks = [avalanche, avalancheFuji];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  defaultNetwork: avalanche,
});
