"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";

interface Usage {
  totalBytes: number;
  recordingCount: number;
  bySource: { sourceType: string; recordingCount: number; bytes: number; durationSeconds: number }[];
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Usage>("/v1/account/usage").then(setUsage).catch((e: Error) => setError(e.message));
  }, []);

  async function exportAll() {
    const res = await api<{ note: string; recordingCount: number }>("/v1/account/export", { method: "POST" });
    setNote(`${res.note} (${res.recordingCount} recordings)`);
  }

  async function deleteAccount() {
    const sure = prompt('This permanently deletes your account and ALL recordings. Type "DELETE" to confirm.');
    if (sure !== "DELETE") return;
    await api("/v1/account?confirm=true", { method: "DELETE" });
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div>
      <h1>{t("nav.settings")}</h1>

      <div className="card">
        <h3>{t("settings.language")}</h3>
        <div className="row">
          <button className={`btn ${locale === "en" ? "primary" : ""}`} onClick={() => setLocale("en")}>
            English
          </button>
          <button className={`btn ${locale === "ar" ? "primary" : ""}`} onClick={() => setLocale("ar")}>
            العربية
          </button>
        </div>
      </div>

      <div className="card">
        <h3>{t("settings.usage")}</h3>
        {error && <p className="error">{error}</p>}
        {usage && (
          <table className="usage">
            <thead>
              <tr>
                <th>Source</th>
                <th>Recordings</th>
                <th>Storage</th>
              </tr>
            </thead>
            <tbody>
              {usage.bySource.map((s) => (
                <tr key={s.sourceType}>
                  <td>{s.sourceType}</td>
                  <td>{s.recordingCount}</td>
                  <td>{formatBytes(s.bytes)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <strong>Total</strong>
                </td>
                <td>{usage.recordingCount}</td>
                <td>{formatBytes(usage.totalBytes)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>{t("settings.consentInfo")}</h3>
        <p className="muted">
          <Link href="/settings/consent" style={{ textDecoration: "underline" }}>
            {t("consent.learnMore")}
          </Link>
        </p>
      </div>

      <div className="card">
        <h3>{t("settings.export")}</h3>
        <button className="btn" onClick={() => void exportAll()}>
          {t("settings.export")}
        </button>
        {note && <p className="muted">{note}</p>}
      </div>

      <div className="card">
        <h3 className="error">{t("settings.deleteAccount")}</h3>
        <button className="btn danger" onClick={() => void deleteAccount()}>
          {t("settings.deleteAccount")}
        </button>
      </div>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n >= 1 << 30) return `${(n / (1 << 30)).toFixed(2)} GB`;
  if (n >= 1 << 20) return `${(n / (1 << 20)).toFixed(1)} MB`;
  if (n >= 1 << 10) return `${(n / (1 << 10)).toFixed(0)} KB`;
  return `${n} B`;
}
