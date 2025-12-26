import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";
const COOKIE = "dtf_session";
const EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function POST(req: Request) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }
  try {
    const auth = getFirebaseAdminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN_MS });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_IN_MS / 1000,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}
