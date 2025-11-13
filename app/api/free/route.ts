const FREE_CREDIT_SNAPSHOT = {
  headline: "Resumen express (sin buró)",
  estimatedScoreBand: "680-700",
  utilizationPct: 0.22,
  notes: [
    "Sin moras registradas en los últimos 18 meses.",
    "Tu uso de líneas rotativas se mantiene sano (<30%).",
    "Un informe completo requiere validar identidad y cubrir la tarifa.",
  ],
};

export async function GET() {
  return Response.json({
    ...FREE_CREDIT_SNAPSHOT,
    generatedAt: new Date().toISOString(),
  });
}
