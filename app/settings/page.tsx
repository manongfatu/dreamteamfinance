"use client";
import { useSettings } from '@lib/settingsStore';
import { useState } from 'react';

export default function SettingsPage() {
  const { settings, setEmail, setRemindersEnabled } = useSettings();
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sender =
    process.env.NEXT_PUBLIC_EMAIL_FROM ||
    'Configured via EMAIL_FROM environment variable';

  async function handleTestEmail() {
    setLoading(true);
    setTestStatus(null);
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: settings.email })
      });
      const json = await res.json();
      if (res.ok) {
        setTestStatus('Test email sent successfully.');
      } else {
        setTestStatus(`Email failed: ${json.error || 'Unknown error'}`);
      }
    } catch (e) {
      setTestStatus('Network error while sending test email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header className="app-header">
        <div className="title">Settings</div>
      </header>

      <div className="grid grid-2">
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">Due Date Email Reminders</div>
          </div>
          <div className="card-body">
            <div className="field" style={{ marginBottom: 10 }}>
              <label className="label">Notification email</label>
              <input
                className="input"
                value={settings.email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <div className="hint">Sender (from): {sender}</div>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="label">Email reminders</label>
              <div className="controls">
                <button
                  className={`button ${settings.remindersEnabled ? 'primary' : ''}`}
                  onClick={() => setRemindersEnabled(!settings.remindersEnabled)}
                >
                  {settings.remindersEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
            <div className="controls">
              <button className="button" onClick={handleTestEmail} disabled={loading || !settings.email}>
                {loading ? 'Sending…' : 'Test Email'}
              </button>
            </div>
            {testStatus ? <div className="hint" style={{ marginTop: 8 }}>{testStatus}</div> : null}
          </div>
        </div>

        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">Email Provider (Brevo)</div>
          </div>
          <div className="card-body">
            <ul>
              <li><strong>Brevo</strong>: Set <code>BREVO_API_KEY</code> and <code>EMAIL_FROM</code> in environment variables. Uses the Brevo SMTP/email API. Free tier available.</li>
              <li>Handles rate limits and API errors; shows clear feedback on failure.</li>
            </ul>
            <div className="hint" style={{ marginTop: 8 }}>
              If email isn’t configured, the app will fall back to in-app notifications.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

