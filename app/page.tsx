export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">x402 Bruma — Demo</h1>
      <p className="mb-2">
        Esta ruta está protegida y cuesta <strong>$0.01</strong> en Avalanche
        Fuji:
      </p>
      <a
        href="/premium/hello?network=avalanche-fuji"
        className="inline-block rounded px-3 py-2 border"
      >
        Abrir /premium/hello
      </a>
    </main>
  );
}
