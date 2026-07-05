"use client";

import type { SearchResult } from "@voicevault/shared";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";

export default function SearchPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { q: q.trim(), limit: 20, offset: 0 };
      if (language) body.language = language;
      if (sourceType) body.sourceType = sourceType;
      if (dateFrom) body.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) body.dateTo = new Date(dateTo).toISOString();
      const res = await api<{ results: SearchResult[] }>("/v1/search", { method: "POST", body });
      setResults(res.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={run} className="card">
        <div className="row">
          <input
            style={{ flex: 1, padding: 10, background: "var(--panel-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8 }}
            placeholder={t("search.placeholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            // dir=auto renders RTL queries (Arabic/Farsi/Urdu) correctly
            dir="auto"
          />
          <button className="btn primary" disabled={busy} type="submit">
            {t("nav.search")}
          </button>
        </div>
        <details style={{ marginTop: 8 }}>
          <summary className="muted">{t("search.filters")}</summary>
          <div className="row" style={{ marginTop: 8 }}>
            <label className="muted">{t("search.language")}</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">—</option>
              {["en", "ar", "fa", "hi", "ur", "fr", "es", "de", "ru", "tr", "zh"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <label className="muted">{t("search.source")}</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              <option value="">—</option>
              <option value="mic">mic</option>
              <option value="meeting">meeting</option>
              <option value="call">call</option>
            </select>
            <label className="muted">{t("search.dateFrom")}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <label className="muted">{t("search.dateTo")}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </details>
      </form>

      {error && <p className="error">{error}</p>}
      {results !== null && results.length === 0 && <p className="muted">{t("search.noResults")}</p>}
      {results?.map((r) => (
        <div className="card" key={r.recordingId}>
          <div className="row">
            <Link href={`/recordings/${r.recordingId}`}>
              <strong>{r.title}</strong>
            </Link>
            {r.language && <span className="badge">{r.language}</span>}
            <span className="muted">{new Date(r.recordedAt).toLocaleDateString()}</span>
          </div>
          {r.matches.map((m, i) => (
            <Link
              key={i}
              href={
                m.timeSeconds !== null
                  ? `/recordings/${r.recordingId}?t=${m.timeSeconds}`
                  : `/recordings/${r.recordingId}`
              }
            >
              <p dir="auto" style={{ marginBlock: 6 }}>
                {m.timeSeconds !== null && <span className="badge">{formatTime(m.timeSeconds)}</span>}{" "}
                {/* snippetHtml is server-generated with all transcript text
                    HTML-escaped; only our own <mark> tags remain. */}
                <span dangerouslySetInnerHTML={{ __html: m.snippetHtml }} />
              </p>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
