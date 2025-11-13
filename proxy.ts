// proxy.ts (raíz del proyecto)
import type { NextRequest } from "next/server";
import { type Address, isAddress } from "viem";
import { type Network, paymentMiddleware, type Resource } from "x402-next";

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

const defaultNetwork = (process.env.NEXT_PUBLIC_DEFAULT_NETWORK ||
  "avalanche-fuji") as Network;

// Redes soportadas explícitamente (extiende este array si añades más)
const SUPPORTED_NETWORKS = new Set<Network>(["avalanche-fuji", "avalanche", "base-sepolia"]);

// Mapa de rutas protegidas (ajusta precios/paths a tu gusto)
const routesFor = (network: Network) => ({
  "/premium/hello": {
    price: "$0.01",
    network,
    config: { description: "Hello premium" },
  },
  "/export/json": {
    price: "$0.01",
    network,
    config: { description: "Export JSON" },
  },
  "/export/yaml": {
    price: "$0.01",
    network,
    config: { description: "Export YAML" },
  },
  "/export/csv": {
    price: "$0.01",
    network,
    config: { description: "Export CSV" },
  },
});

type Delegate = ReturnType<typeof paymentMiddleware>;
const delegateCache = new Map<Network, Delegate>();

const getOrCreateDelegate = (network: Network) => {
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

const resolveNetwork = (value: string | null): Network => {
  if (value && SUPPORTED_NETWORKS.has(value as Network)) {
    return value as Network;
  }
  return defaultNetwork;
};

// ✅ Exporta *proxy* (no middleware)
export default function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const network = resolveNetwork(url.searchParams.get("network"));
  const delegate = getOrCreateDelegate(network);
  return delegate(req);
}

// ✅ Limita dónde corre el proxy (para que intercepte y devuelva 402)
export const config = {
  matcher: [
    "/premium/:path*",
    "/export/:path*",
    // si luego vendes APIs: '/api/premium/:path*',
  ],
};
