import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Endpoint disabled for security reasons." }, { status: 403 });
}
