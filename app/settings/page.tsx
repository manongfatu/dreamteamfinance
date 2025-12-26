"use client";
import { useSettings } from '@lib/settingsStore';
import { useEffect, useState } from 'react';
import { getFirebaseAuth } from '@lib/firebase/client';

export default function SettingsPage() {
  const { settings, setEmail, setRemindersEnabled, setFirstName, setLastName, setContactNumber } = useSettings();
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [draftFirst, setDraftFirst] = useState(settings.firstName);
  const [draftLast, setDraftLast] = useState(settings.lastName);
  const [draftContact, setDraftContact] = useState(settings.contactNumber);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const sender =
    process.env.NEXT_PUBLIC_EMAIL_FROM ||
    'Configured via EMAIL_FROM environment variable';

  useEffect(() => {
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        const unsub = auth.onAuthStateChanged(u => setLoginEmail(u?.email ?? ''));
        return () => { if (typeof unsub === 'function') unsub(); };
      } catch {
        setLoginEmail('');
      }
    })();
  }, []);
  useEffect(() => {
    setDraftFirst(settings.firstName);
    setDraftLast(settings.lastName);
    setDraftContact(settings.contactNumber);
  }, [settings.firstName, settings.lastName, settings.contactNumber]);

  const profileDirty =
    draftFirst !== settings.firstName ||
    draftLast !== settings.lastName ||
    draftContact !== settings.contactNumber;

  function handleSaveProfile() {
    try {
      setProfileSaving(true);
      setFirstName(draftFirst.trim());
      setLastName(draftLast.trim());
      setContactNumber(draftContact.trim());
      setProfileSavedMsg('Profile saved.');
      setTimeout(() => setProfileSavedMsg(null), 1500);
    } finally {
      setProfileSaving(false);
    }
  }
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
            <div className="card-title">Profile</div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="field">
                <label className="label">First name</label>
                <input className="input" value={draftFirst} onChange={(e) => setDraftFirst(e.target.value)} placeholder="Juan" />
              </div>
              <div className="field">
                <label className="label">Last name</label>
                <input className="input" value={draftLast} onChange={(e) => setDraftLast(e.target.value)} placeholder="Dela Cruz" />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label className="label">Contact number</label>
                <input
                  className="input"
                  value={draftContact}
                  onChange={(e) => setDraftContact(e.target.value)}
                  placeholder="+63 912 345 6789"
                  inputMode="tel"
                />
                <div className="hint">Use your active mobile for reminders and follow-ups.</div>
              </div>
              <div className="field">
                <label className="label">Login email</label>
                <div className="readonly-field">{loginEmail || 'Not set'}</div>
                <div className="hint">This email is linked to your account and can’t be changed here.</div>
              </div>
            </div>
            <div className="controls" style={{ justifyContent: 'space-between', marginTop: 12 }}>
              <div className="hint">{profileSavedMsg || ''}</div>
              <button className="button primary" onClick={handleSaveProfile} disabled={profileSaving || !profileDirty}>
                {profileSaving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </div>
        </div>

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
                placeholder={loginEmail || 'you@example.com'}
              />
              <div className="hint">Sender (from): {sender}</div>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label className="label">Registered email</label>
              <input className="input" value={loginEmail} disabled readOnly />
              <div className="hint">This is your account email and is not editable here.</div>
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

        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">Account</div>
          </div>
          <div className="card-body">
            <div className="controls">
              <button
                className="button"
                onClick={async () => {
                  try {
                    try { localStorage.removeItem('pfm:v1'); } catch {}
                    await fetch('/api/session/logout', { method: 'POST' });
                  } finally {
                    window.location.href = '/login';
                  }
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

