// app/premium/hello/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    msg: "Hola 👋, gracias por apoyar este endpoint premium.",
  });
}
