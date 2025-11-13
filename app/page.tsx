"use client";

import { useState } from "react";
import {
  type Address,
  createWalletClient,
  custom,
  UserRejectedRequestError,
} from "viem";
import { avalanche, avalancheFuji } from "viem/chains";
import { type Signer, wrapFetchWithPayment } from "x402-fetch";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type WindowWithEthereum = Window & { ethereum?: Eip1193Provider };

const NETWORKS = {
  "avalanche-fuji": {
    label: "Avalanche Fuji (testnet)",
    chain: avalancheFuji,
  },
  avalanche: {
    label: "Avalanche (mainnet)",
    chain: avalanche,
  },
} as const;

type NetworkKey = keyof typeof NETWORKS;

type LoadingState = "free" | "premium" | null;

const fetchJson = async <T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
) => {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(`Solicitud falló con ${res.status}`);
  }
  return (await res.json()) as T;
};

const getEthereumProvider = (): Eip1193Provider => {
  const provider = (window as WindowWithEthereum).ethereum;
  if (!provider) {
    throw new Error("Conecta una wallet compatible con Avalanche.");
  }
  return provider;
};

export default function Home() {
  const [selectedNetwork, setSelectedNetwork] =
    useState<NetworkKey>("avalanche-fuji");
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>(null);

  const handleFreePromptClick = async () => {
    try {
      setLoading("free");
      setError(null);
      setReport(null);
      const data = await fetchJson("/api/free");
      setReport(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos cargar el resumen gratuito.",
      );
    } finally {
      setLoading(null);
    }
  };

  const handlePremiumPromptClick = async () => {
    try {
      setLoading("premium");
      setError(null);
      setReport(null);

      const ethereum = getEthereumProvider();
      const [address] = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as Address[];

      if (!address) {
        throw new Error("No recibimos ninguna cuenta de la wallet.");
      }

      const walletClient = createWalletClient({
        account: address,
        chain: NETWORKS[selectedNetwork].chain,
        transport: custom(ethereum),
      });

      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        walletClient as unknown as Signer,
      );

      const query = new URLSearchParams({
        network: selectedNetwork,
      }).toString();

      const res = await fetchWithPayment(`/api/premium?${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Pago rechazado (${res.status})`);
      }

      const data = await res.json();
      setReport(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Payment error:", err);
      if (err instanceof UserRejectedRequestError) {
        setError("Cancelaste la solicitud en la wallet. Nada fue cobrado.");
        return;
      }
      if (
        err instanceof Error &&
        /user rejected the request/i.test(err.message)
      ) {
        setError("Cancelaste la solicitud en la wallet. Nada fue cobrado.");
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos desbloquear el informe premium.",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 space-y-2">
        <p className="text-sm uppercase tracking-wide text-gray-500">
          x402 + Avalanche
        </p>
        <h1 className="text-3xl font-semibold">
          Simulador de Informe Crediticio
        </h1>
        <p className="text-sm text-gray-500">
          Consulta un resumen gratuito y desbloquea un informe premium falso
          tras cubrir la tarifa via x402 en USDC (Avalanche/Avalanche Fuji).
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium" htmlFor="network-select">
          Red de pago
        </label>
        <select
          id="network-select"
          value={selectedNetwork}
          onChange={(event) =>
            setSelectedNetwork(event.target.value as NetworkKey)
          }
          className="rounded border px-3 py-2 text-sm font-mono"
        >
          {Object.entries(NETWORKS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-4">
        <li className="rounded-md border p-4">
          <div className="mt-2 text-sm">Resumen gratuito</div>
          <h2 className="text-xl font-medium">
            Estimación express (sin buró real)
          </h2>
          <button
            type="button"
            onClick={handleFreePromptClick}
            disabled={loading === "free"}
            className="mt-3 inline-block rounded bg-black px-3 py-1.5 text-xs font-mono text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "free" ? "Consultando..." : "Ver resumen"}
          </button>
        </li>

        <li className="rounded-md border p-4">
          <div className="mt-2 text-sm">
            Informe premium <span className="font-mono">$0.01</span>
          </div>
          <h2 className="text-xl font-medium">
            Reporte crediticio simulado (JSON detallado)
          </h2>
          <button
            type="button"
            onClick={handlePremiumPromptClick}
            disabled={loading === "premium"}
            className="mt-3 inline-block rounded bg-black px-3 py-1.5 text-xs font-mono text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "premium" ? "Generando..." : "Desbloquear informe"}
          </button>
        </li>
      </ul>

      <div className="mt-6 min-h-[120px] rounded border border-dashed p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
          Resultado
        </p>
        {report && (
          <pre className="whitespace-pre-wrap text-sm font-mono">{report}</pre>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!report && !error && (
          <p className="text-sm text-gray-500">
            Consulta un resumen o desbloquea el informe premium para verlo aquí.
          </p>
        )}
      </div>
    </main>
  );
}
