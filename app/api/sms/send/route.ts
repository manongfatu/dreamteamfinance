import { NextResponse } from "next/server";

function envTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) return null;
  return { sid, token, from };
}

export async function POST(request: Request) {
  const { to, message } = await request.json().catch(() => ({}));
  if (!to || typeof to !== "string" || !message || typeof message !== "string") {
    return NextResponse.json({ error: 'Missing "to" and "message"' }, { status: 400 });
  }

  const twilio = envTwilio();
  if (!twilio) {
    // Not configured
    return NextResponse.json({ error: "SMS not configured (Twilio env vars missing)." }, { status: 501 });
  }

  try {
    const body = new URLSearchParams({
      From: twilio.from,
      To: to,
      Body: message,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Twilio error: ${err}` }, { status: 502 });
    }
    const json = await res.json();
    return NextResponse.json({ ok: true, sid: json.sid });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
