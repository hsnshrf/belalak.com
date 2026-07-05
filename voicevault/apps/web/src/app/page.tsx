"use client";

import type { Recording } from "@voicevault/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, isLoggedIn } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";

type View = "all" | "favorites" | "archived" | "trash";

export default function LibraryPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [view, setView] = useState<View>("all");
  const [items, setItems] = useState<Recording[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    api<{ items: Recording[] }>(`/v1/recordings?view=${view}`)
      .then((res) => setItems(res.items))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [view, router]);

  return (
    <div>
      <div className="row" style={{ marginBlock: 16 }}>
        {(["all", "favorites", "archived", "trash"] as const).map((v) => (
          <button key={v} className={`btn ${view === v ? "primary" : ""}`} onClick={() => setView(v)}>
            {t(`library.${v}` as never)}
          </button>
        ))}
        <span className="spacer" style={{ flex: 1 }} />
        <Link href="/record" className="btn primary">
          ● {t("nav.record")}
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {!loading && items.length === 0 && <p className="muted">{t("library.empty")}</p>}
      {items.map((r) => (
        <Link key={r.id} href={`/recordings/${r.id}`}>
          <div className="card">
            <div className="row">
              <strong>{r.title}</strong>
              {r.isFavorite && <span>★</span>}
              <span className="spacer" style={{ flex: 1 }} />
              <span className="badge">{r.sourceType}</span>
              {r.languageDominant && <span className="badge">{r.languageDominant}</span>}
              {r.transcriptionStatus === "processing" || r.transcriptionStatus === "queued" ? (
                <span className="badge warn">{t("library.transcribing")}</span>
              ) : r.transcriptionStatus === "failed" ? (
                <span className="badge warn">{t("library.failed")}</span>
              ) : r.transcriptionStatus === "done" ? (
                <span className="badge ok">✓</span>
              ) : null}
            </div>
            <div className="muted">
              {new Date(r.recordedAt).toLocaleString()}
              {r.durationSeconds ? ` · ${formatDuration(r.durationSeconds)}` : ""}
              {!r.consentAcknowledged && r.sourceType !== "mic" ? " · consent not acknowledged" : ""}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}
