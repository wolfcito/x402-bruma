// proxy.ts (raíz del proyecto)
import type { NextRequest } from "next/server";
import { type Address, isAddress } from "viem";
import {
  type Network,
  paymentMiddleware,
  type Resource,
  type RoutesConfig,
} from "x402-next";
import { type NetworkString, normalizeNetwork } from "./utils/network";

const receiverEnv = process.env.NEXT_PUBLIC_EVM_RECEIVER_ADDRESS;
if (!receiverEnv) {
  throw new Error("Missing NEXT_PUBLIC_EVM_RECEIVER_ADDRESS");
}
if (!isAddress(receiverEnv)) {
  throw new Error(
    "NEXT_PUBLIC_EVM_RECEIVER_ADDRESS must be a valid EVM address",
  );
}
const receiver: Address = receiverEnv;

const facilitator = process.env.NEXT_PUBLIC_FACILITATOR_URL;
if (!facilitator) {
  throw new Error("Missing NEXT_PUBLIC_FACILITATOR_URL");
}
const facilitatorUrl = facilitator as Resource;

const FALLBACK_NETWORK: NetworkString = "avalanche-fuji";

const rawDefaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK;
const configuredNetwork = normalizeNetwork(rawDefaultNetwork);
if (rawDefaultNetwork && !configuredNetwork) {
  throw new Error(
    `NEXT_PUBLIC_DEFAULT_NETWORK must be a supported network alias, received: ${rawDefaultNetwork}`,
  );
}
const defaultNetwork = configuredNetwork ?? FALLBACK_NETWORK;

type SupportedResponse = {
  kinds?: { network: string; scheme: string }[];
};

const FACILITATOR_CACHE_TTL_MS = 5 * 60 * 1_000;
let facilitatorSupportedNetworks: Set<NetworkString> | null = null;
let facilitatorSupportedFetchedAt = 0;
let facilitatorSupportedPromise: Promise<Set<NetworkString>> | null = null;

const facilitatorSupportedEndpoint = (() => {
  try {
    return new URL("/supported", facilitatorUrl).toString();
  } catch {
    return `${facilitatorUrl.replace(/\/$/, "")}/supported`;
  }
})();

const parseFacilitatorNetworks = (payload: SupportedResponse) => {
  const networks = new Set<NetworkString>();
  for (const kind of payload.kinds ?? []) {
    const parsed = normalizeNetwork(kind.network);
    if (parsed) {
      networks.add(parsed);
    }
  }
  return networks;
};

const loadFacilitatorNetworks = async () => {
  try {
    const response = await fetch(facilitatorSupportedEndpoint, {
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn(
        `[x402 proxy] Facilitator /supported returned ${response.status}`,
      );
      return facilitatorSupportedNetworks ?? new Set<NetworkString>();
    }
    const json = (await response.json()) as SupportedResponse;
    const networks = parseFacilitatorNetworks(json);
    console.info(
      "[x402 proxy] Facilitator supports:",
      [...networks].join(", ") || "none",
    );
    if (!networks.size) {
      console.warn(
        "[x402 proxy] Facilitator did not return any supported networks.",
      );
    }
    facilitatorSupportedNetworks = networks;
    facilitatorSupportedFetchedAt = Date.now();
    return networks;
  } catch (error) {
    console.warn(
      "[x402 proxy] Failed to load facilitator support list.",
      error,
    );
    return facilitatorSupportedNetworks ?? new Set<NetworkString>();
  }
};

const getFacilitatorNetworks = async () => {
  const now = Date.now();
  if (
    facilitatorSupportedNetworks &&
    now - facilitatorSupportedFetchedAt < FACILITATOR_CACHE_TTL_MS
  ) {
    return facilitatorSupportedNetworks;
  }
  let promise = facilitatorSupportedPromise;
  if (!promise) {
    promise = loadFacilitatorNetworks().finally(() => {
      facilitatorSupportedPromise = null;
    });
    facilitatorSupportedPromise = promise;
  }
  return promise;
};

// Mapa de rutas protegidas (ajusta precios/paths a tu gusto)
const coerceNetwork = (network: NetworkString): Network => network as Network;

const USD_MINOR_AMOUNT = "10000"; // $0.01 with 6 decimals
const ERC20_PRICE_ASSETS: Record<
  NetworkString,
  {
    address: `0x${string}`;
    decimals: number;
    eip712: { name: string; version: string };
  }
> = {
  "avalanche-fuji": {
    address: "0x5425890298aed601595a70ab815c96711a31bc65",
    decimals: 6,
    eip712: { name: "USD Coin", version: "2" },
  },
  avalanche: {
    address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimals: 6,
    eip712: { name: "USD Coin", version: "2" },
  },
};

const priceFor = (network: NetworkString) => {
  const asset = ERC20_PRICE_ASSETS[network];
  if (!asset) {
    return "$0.01";
  }
  return {
    amount: USD_MINOR_AMOUNT,
    asset,
  };
};

const routesFor = (network: NetworkString): RoutesConfig => ({
  "/api/premium": {
    price: priceFor(network),
    network: coerceNetwork(network),
    config: { description: "Credit report (simulado)" },
  },
});

type Delegate = ReturnType<typeof paymentMiddleware>;
const delegateCache = new Map<NetworkString, Delegate>();

const getOrCreateDelegate = (network: NetworkString) => {
  const cached = delegateCache.get(network);
  if (cached) {
    return cached;
  }

  const handler = paymentMiddleware(
    receiver,
    routesFor(network),
    { url: facilitatorUrl },
    // Paywall embebido de Coinbase es opcional; si tu usuario ya trae USDC, déjalo fuera.
    // {
    //   cdpClientKey: process.env.NEXT_PUBLIC_CDP_CLIENT_KEY,
    //   appLogo: '/logos/x402-examples.png',
    //   appName: 'x402 Avalanche Demo',
    //   sessionTokenEndpoint: '/api/x402/session-token',
    // }
  );

  delegateCache.set(network, handler);
  return handler;
};

const resolveNetwork = async (value: string | null): Promise<NetworkString> => {
  const requested = normalizeNetwork(value);
  const supported = await getFacilitatorNetworks();
  if (!supported?.size) {
    return requested ?? defaultNetwork;
  }
  if (requested && supported.has(requested)) {
    return requested;
  }
  if (requested) {
    return requested;
  }
  if (supported.has(defaultNetwork)) {
    return defaultNetwork;
  }
  const [first] = supported;
  return first ?? defaultNetwork;
};

// ✅ Exporta *proxy* (no middleware)
export default async function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const network = await resolveNetwork(url.searchParams.get("network"));
  console.info("[x402 proxy] chosen network:", network);
  const delegate = getOrCreateDelegate(network);
  return delegate(req);
}

// ✅ Limita dónde corre el proxy (para que intercepte y devuelva 402)
export const config = {
  matcher: [
    "/api/premium/:path*",
    // agrega más APIs premium aquí cuando sea necesario
  ],
};
