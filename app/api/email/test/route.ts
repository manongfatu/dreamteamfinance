import { NextResponse } from "next/server";
import { renderReminderHtml, sendBrevoEmail } from "@lib/email";

export async function POST(request: Request) {
  const { to } = await request.json().catch(() => ({}));
  if (!to || typeof to !== "string") {
    return NextResponse.json({ error: 'Missing "to" email address' }, { status: 400 });
  }

  // Use same template as real reminders with sample content
  const subject = "Dream Team Finance: Upcoming installment due in 3 days (Test)";
  const lines = ["Sample Item A on " + new Date(Date.now() + 3 * 86400000).toLocaleDateString() + " ($100.00)", "Sample Item B on " + new Date(Date.now() + 3 * 86400000).toLocaleDateString() + " ($75.00)"];
  const text = `You have ${lines.length} installment(s) due in 3 days.\n\n` + lines.map((l) => `• ${l}`).join("\n");
  const html = renderReminderHtml("Upcoming installment due in 3 days", lines);

  const sent = await sendBrevoEmail(to, subject, html, text);
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: sent.status || 500 });
  }
  return NextResponse.json({ ok: true, id: sent.id, provider: "brevo" });
}
