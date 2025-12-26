import { NextResponse } from "next/server";

export const runtime = "nodejs";
const COOKIE = "dtf_session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
