const BASE_CREDIT_REPORT = {
  applicant: {
    name: "Renata Bruma",
    idNumber: "BRU-402-7701",
    email: "renata.bruma@example.com",
  },
  score: {
    value: 742,
    tier: "Prime",
    provider: "x402 Bruma Labs — Simulado",
  },
  summary: {
    totalCredit: 42000,
    totalBalance: 10250,
    utilizationPct: 24.4,
    delinquentAccounts: 0,
  },
  accounts: [
    {
      institution: "Banco Andino",
      last4: "8821",
      opened: "2021-05-14",
      limit: 25000,
      balance: 6200,
      status: "open",
      paymentHistory: ["✔", "✔", "✔", "✔", "✔", "✔"],
    },
    {
      institution: "Cooperativa Nevado",
      last4: "1180",
      opened: "2019-10-03",
      limit: 12000,
      balance: 2850,
      status: "open",
      paymentHistory: ["✔", "✔", "✔", "✔", "✔", "✔"],
    },
    {
      institution: "Microcréditos Brava",
      last4: "6409",
      opened: "2018-01-20",
      limit: 5000,
      balance: 1200,
      status: "closed",
      paymentHistory: ["✔", "✔", "✔", "✔", "✔", "✔"],
    },
  ],
  alerts: [
    {
      type: "inquiry",
      source: "Avalanche Lending DAO",
      date: "2024-11-03",
      note: "Consulta blanda asociada a solicitud de crédito Web3",
    },
    {
      type: "utilization",
      source: "Banco Andino",
      date: "2024-10-18",
      note: "Uso >25% en la tarjeta principal durante 2 ciclos",
    },
  ],
};

export async function GET() {
  return Response.json({
    ...BASE_CREDIT_REPORT,
    requestedAt: new Date().toISOString(),
  });
}
