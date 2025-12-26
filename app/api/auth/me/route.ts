import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return new NextResponse(null, { status: 204 });
  return NextResponse.json({ user });
}
