import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword, createSession } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Server misconfigured: DATABASE_URL is not set. Please configure your database connection." }, { status: 500 });
  }
  const { email, password } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const e = email.trim().toLowerCase();
  try {
    const user = await prisma.user.findUnique({ where: { email: e } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    const message = process.env.NODE_ENV === "development" ? `Login failed: ${err?.message ?? "Unknown error"}` : "Login failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
