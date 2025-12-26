import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword, createSession } from "../../../../lib/auth";

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
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  try {
    const exists = await prisma.user.findUnique({ where: { email: e } });
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email: e, passwordHash } });
    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    const message = err?.code === "P2002" ? "Email already registered" : process.env.NODE_ENV === "development" ? `Registration failed: ${err?.message ?? "Unknown error"}` : "Registration failed. Please try again.";
    const status = err?.code === "P2002" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
