"use client";

import { useState } from "react";
import { ApiError, getTokens } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/** Export transcript (txt/srt/docx/pdf) + expiring share link. */
export function ExportMenu({ recordingId }: { recordingId: string }) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function download(format: "txt" | "srt" | "docx" | "pdf") {
    setError(null);
    const res = await fetch(`${API_BASE}/v1/recordings/${recordingId}/export`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${getTokens().access}`,
      },
      body: JSON.stringify({ format, transcriptKind: "edited" }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? `Export failed (${res.status})`);
      return;
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const disposition = res.headers.get("content-disposition") ?? "";
    const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
    a.download = match ? decodeURIComponent(match[1]!) : `transcript.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function share() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/recordings/${recordingId}/share-link`, {
        method: "POST",
        headers: { authorization: `Bearer ${getTokens().access}` },
      });
      if (!res.ok) throw new ApiError(res.status, `Share failed (${res.status})`);
      const body = (await res.json()) as { url: string };
      setShareUrl(body.url);
      await navigator.clipboard.writeText(body.url).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="row">
      <span className="muted">{t("player.export")}:</span>
      {(["txt", "srt", "docx", "pdf"] as const).map((f) => (
        <button key={f} className="btn" onClick={() => void download(f)}>
          {f.toUpperCase()}
        </button>
      ))}
      <button className="btn" onClick={() => void share()}>
        🔗 Share link
      </button>
      {shareUrl && (
        <span className="muted" style={{ wordBreak: "break-all" }}>
          copied: {shareUrl}
        </span>
      )}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
