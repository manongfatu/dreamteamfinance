import { NextResponse } from "next/server";
import { renderReminderHtml, sendBrevoEmail } from "@lib/email";

export async function POST(request: Request) {
  const { to, subject, text, html } = await request.json().catch(() => ({}));
  if (!to || typeof to !== "string" || !subject || typeof subject !== "string" || !text || typeof text !== "string") {
    return NextResponse.json({ error: 'Missing "to", "subject", and "text"' }, { status: 400 });
  }

  const finalHtml = typeof html === "string" && html.length > 0 ? html : renderReminderHtml(subject, text.split("\n").filter(Boolean));

  const sent = await sendBrevoEmail(to, subject, finalHtml, text);
  if (!sent.ok) {
    const status = sent.status || 500;
    return NextResponse.json({ error: sent.error }, { status });
  }
  return NextResponse.json({ ok: true, id: sent.id, provider: "brevo" });
}
