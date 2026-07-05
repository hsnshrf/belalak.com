"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, setTokens } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const path = mode === "login" ? "/v1/auth/login" : "/v1/auth/signup";
      const body = mode === "login" ? { email, password } : { email, password, displayName };
      const tokens = await api<{ accessToken: string; refreshToken: string }>(path, {
        method: "POST",
        body,
      });
      setTokens(tokens.accessToken, tokens.refreshToken);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "48px auto" }}>
      <h1>{mode === "login" ? t("auth.login") : t("auth.signup")}</h1>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <div className="field">
            <label>{t("auth.displayName")}</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
        )}
        <div className="field">
          <label>{t("auth.email")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>{t("auth.password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === "signup" ? 10 : undefined}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy} type="submit" style={{ width: "100%" }}>
          {mode === "login" ? t("auth.login") : t("auth.signup")}
        </button>
      </form>
      <p className="muted" style={{ textAlign: "center" }}>
        {t("auth.or")}
      </p>
      <div className="row" style={{ justifyContent: "center" }}>
        {(["google", "microsoft", "apple"] as const).map((p) => (
          <a key={p} className="btn" href={`${API_BASE}/v1/auth/oauth/${p}/start`}>
            {p[0]!.toUpperCase() + p.slice(1)}
          </a>
        ))}
      </div>
      <p style={{ textAlign: "center" }}>
        <button className="btn" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? t("auth.signup") : t("auth.login")}
        </button>
      </p>
    </div>
  );
}
