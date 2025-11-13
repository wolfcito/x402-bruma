// app/export/csv/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const row = [
    "demo/repo",
    4.2,
    4.5,
    1.1,
    66.7,
    75.0,
    80,
    new Date().toISOString(),
  ];
  const csv = `Repository,Overall(0-5),Technical(0-5),SecurityRisk(~0-5),OnChain(%),Docs(%),Payment(0-100),Timestamp\n${row.join(",")}\n`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="metrics.csv"',
      "Cache-Control": "no-store",
    },
  });
}
