export function renderReminderHtml(title: string, lines: string[]): string {
  const items = lines.map((l) => `<li style="margin:6px 0">${escapeHtml(l)}</li>`).join("");
  return `<!doctype html>
<html>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f6f7f9; margin:0; padding:24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px;">
      <tr>
        <td style="padding:20px 20px 8px; border-bottom:1px solid #e5e7eb;">
          <div style="font-size:18px; color:#0f172a; font-weight:600;">Dream Team Finance</div>
          <div style="font-size:12px; color:#64748b; margin-top:4px;">Calm, reliable reminders</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
          <div style="font-size:16px; color:#0f172a; font-weight:600; margin-bottom:10px;">${escapeHtml(title)}</div>
          <ul style="padding-left:18px; margin:0;">
            ${items}
          </ul>
          <div style="margin-top:16px; font-size:12px; color:#64748b;">You can disable reminders any time in Settings.</div>
        </td>
      </tr>
    </table>
    <div style="text-align:center; margin-top:12px; font-size:11px; color:#94a3b8;">© ${new Date().getFullYear()} Kenming Finance</div>
  </body>
</html>`;
}

export async function sendBrevoEmail(to: string, subject: string, html: string, text: string) {
  const from = process.env.EMAIL_FROM;
  const apiKey = process.env.BREVO_API_KEY;
  const smtpHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const smtpPort = Number(process.env.BREVO_SMTP_PORT || 587);
  const smtpUser = process.env.BREVO_SMTP_LOGIN;
  const smtpPass = process.env.BREVO_SMTP_KEY;

  if (!from) {
    return { ok: false as const, status: 501, error: "Email not configured: set EMAIL_FROM" };
  }

  if (apiKey) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: from, name: "Kenming Finance" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // If API fails and SMTP creds exist, try SMTP as fallback
      if (smtpUser && smtpPass) {
        const smtpResult = await trySmtpSend({ smtpHost, smtpPort, smtpUser, smtpPass, from, to, subject, text, html });
        if (!smtpResult.ok) {
          return { ok: false as const, status: res.status, error: body || `HTTP ${res.status}` };
        }
        return smtpResult;
      }
      return { ok: false as const, status: res.status, error: body || `HTTP ${res.status}` };
    }
    const json = await res.json().catch(() => ({}));
    return { ok: true as const, status: 200, id: json?.messageId ?? null };
  }

  if (smtpUser && smtpPass) {
    return await trySmtpSend({ smtpHost, smtpPort, smtpUser, smtpPass, from, to, subject, text, html });
  }

  return {
    ok: false as const,
    status: 501,
    error: "Email not configured: set BREVO_API_KEY or BREVO_SMTP_LOGIN/BREVO_SMTP_KEY and EMAIL_FROM",
  };
}

async function trySmtpSend({ smtpHost, smtpPort, smtpUser, smtpPass, from, to, subject, text, html }: { smtpHost: string; smtpPort: number; smtpUser: string; smtpPass: string; from: string; to: string; subject: string; text: string; html: string }) {
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    const info = await transporter.sendMail({
      from: `Kenming Finance <${from}>`,
      to,
      subject,
      text,
      html,
    });
    return { ok: true as const, status: 200, id: (info as any)?.messageId ?? null };
  } catch (e: any) {
    return { ok: false as const, status: 500, error: e?.message ?? "SMTP send failed" };
  }
}

function escapeHtml(input: string): string {
  return input.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
