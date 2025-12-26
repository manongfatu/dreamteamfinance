"use client";
export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useSettings } from "@/lib/settingsStore";

export default function LoginPage() {
  const router = useRouter();
  const { setEmail: setNotifyEmail } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirectTo, setRedirectTo] = useState("/");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/session/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
      if (!res.ok) throw new Error("Failed to establish session");
      // Default notifications to signed-in email if not set yet
      try { setNotifyEmail(cred.user.email || email); } catch {}
      router.replace(redirectTo || "/");
    } catch (e: any) {
      const code = e?.code;
      const friendly =
        code === "auth/wrong-password" || code === "auth/user-not-found"
          ? "Invalid email or password"
          : code === "auth/invalid-email"
          ? "Please enter a valid email address"
          : "Login failed. Check your credentials and try again.";
      setError(friendly);
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const target = url.searchParams.get("redirect");
      setRedirectTo(target || "/");
    } catch {
      setRedirectTo("/");
    }
  }, []);

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
          <div className="card-title" style={{ fontSize: 18 }}>Sign in</div>
        </div>
        <div className="card-body">
          <form className="form" onSubmit={onSubmit}>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error ? <div className="error">{error}</div> : <div className="hint">Enter your credentials to continue.</div>}
            <div className="controls" style={{ justifyContent: "space-between", marginTop: 12 }}>
              <a href="/register" className="button" style={{ whiteSpace: "nowrap" }}>Create account</a>
              <button className="button primary" style={{ whiteSpace: "nowrap" }} disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </div>
            <div className="controls" style={{ marginTop: 12 }}>
              <a href="/forgot" className="link" style={{ color: "var(--primary)" }}>Forgot password?</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

