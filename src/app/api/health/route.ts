import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    application: "Words of Medicine",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
