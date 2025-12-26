"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { updateProfile } from "firebase/auth";
import { useSettings } from "@/lib/settingsStore";

export default function RegisterPage() {
  const router = useRouter();
  const { setEmail: setNotifyEmail } = useSettings();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  function updateRules(pw: string) {
    setRules({
      length: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      number: /\d/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw),
    });
  }

  const allValid = rules.length && rules.upper && rules.lower && rules.number && rules.special && password === confirm && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // quick client-side validation
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please provide your first and last name");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!(rules.length && rules.upper && rules.lower && rules.number && rules.special)) {
      setError("Password must meet all the requirements");
      return;
    }
    setLoading(true);
    try {
      const auth = await getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password).catch((err: any) => {
        // Friendly error messages
        if (err?.code === "auth/email-already-in-use") {
          throw new Error("Email already registered");
        }
        if (err?.code === "auth/invalid-email") {
          throw new Error("Please enter a valid email address");
        }
        if (err?.code === "auth/weak-password") {
          throw new Error("Password is too weak");
        }
        throw err;
      });
      // Update profile with display name
      try {
        await updateProfile(cred.user, { displayName: `${firstName.trim()} ${lastName.trim()}` });
      } catch {}
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/session/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
      if (!res.ok) throw new Error("Failed to establish session");
      // Use the registered email as default notification email
      try { setNotifyEmail(email); } catch {}
      router.replace("/");
    } catch (err: any) {
      const msg = typeof err?.message === "string"
        ? (err.message === "Email already registered" ? "Email already registered" : err.message)
        : "Registration failed. Please try again.";
      setError(msg);
      setLoading(false);
    }
  }

  useEffect(() => {
    // If already signed in with Firebase, you can redirect; keep simple for now
  }, [router]);

  return (
    <div
      className="container"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        paddingTop: 24,
        paddingBottom: 24,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "clamp(360px, 50vw, 840px)",
        }}
      >
        <div className="card-header">
          <div className="card-title" style={{ fontSize: 18 }}>Create your account</div>
        </div>
        <div className="card-body">
          <form className="form" onSubmit={onSubmit}>
            <div className="row">
              <div className="field">
                <label className="label">First name</label>
                <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" required />
              </div>
              <div className="field">
                <label className="label">Last name</label>
                <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" required />
              </div>
            </div>
            <div className="field">
              <label className="label">Contact number (optional)</label>
              <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+63 912 345 6789" />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="row">
              <div className="field">
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPassword(v);
                    updateRules(v);
                  }}
                  required
                />
              </div>
              <div className="field">
                <label className="label">Confirm password</label>
                <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
            </div>
            <div className="hint" style={{ marginTop: 6 }}>
              <div>Password must include:</div>
              <ul style={{ margin: 6, paddingLeft: 18 }}>
                <li style={{ color: rules.length ? 'var(--ok)' : 'var(--muted)' }}>Minimum 8 characters</li>
                <li style={{ color: rules.upper ? 'var(--ok)' : 'var(--muted)' }}>At least one uppercase letter</li>
                <li style={{ color: rules.lower ? 'var(--ok)' : 'var(--muted)' }}>At least one lowercase letter</li>
                <li style={{ color: rules.number ? 'var(--ok)' : 'var(--muted)' }}>At least one number</li>
                <li style={{ color: rules.special ? 'var(--ok)' : 'var(--muted)' }}>At least one special character</li>
              </ul>
              <div style={{ fontWeight: 600, color: allValid ? 'var(--ok)' : 'var(--muted)' }}>
                {allValid ? 'Strong password' : 'Keep typing to meet all rules'}
              </div>
            </div>
            {error ? <div className="error" style={{ marginTop: 6 }}>{error}</div> : null}
            <div className="controls" style={{ justifyContent: "space-between", marginTop: 12 }}>
              <a href="/login" className="button" style={{ whiteSpace: "nowrap" }}>Back to sign in</a>
              <button className="button primary" style={{ whiteSpace: "nowrap" }} disabled={loading || !allValid}>
                {loading ? "Creating…" : "Create account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

