"use client";

import type { Recording, Speaker, Transcript } from "@voicevault/shared";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { TranscriptView } from "@/components/TranscriptView";
import { api } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";

type Detail = Recording & {
  audioUrl: string | null;
  transcript: Transcript | null;
  speakers: Speaker[];
};

export default function RecordingDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const query = useSearchParams();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);

  const load = useCallback(() => {
    api<Detail>(`/v1/recordings/${params.id}`)
      .then(setDetail)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  useEffect(load, [load]);

  // Poll while transcription is still running so the transcript appears live.
  useEffect(() => {
    if (!detail || detail.transcript) return;
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [detail, load]);

  // ?t=123.4 → search results deep-link straight to the matched second.
  useEffect(() => {
    const at = query.get("t");
    if (at && audioRef.current) {
      audioRef.current.currentTime = Number(at);
      void audioRef.current.play().catch(() => {});
    }
  }, [query, detail?.audioUrl]);

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      void audioRef.current.play().catch(() => {});
    }
  };

  const skip = (delta: number) => {
    if (audioRef.current) audioRef.current.currentTime += delta;
  };

  async function rename() {
    if (!detail) return;
    const title = prompt("Rename recording", detail.title);
    if (title && title.trim()) {
      await api(`/v1/recordings/${detail.id}`, { method: "PATCH", body: { title: title.trim() } });
      load();
    }
  }

  async function toggleFavorite() {
    if (!detail) return;
    await api(`/v1/recordings/${detail.id}`, { method: "PATCH", body: { isFavorite: !detail.isFavorite } });
    load();
  }

  async function trash() {
    if (!detail) return;
    await api(`/v1/recordings/${detail.id}`, { method: "DELETE" });
    router.push("/");
  }

  async function retryTranscription() {
    await api(`/v1/recordings/${params.id}/transcription`, { method: "POST", body: {} });
    load();
  }

  if (error) return <p className="error">{error}</p>;
  if (!detail) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="row">
        <h1 style={{ flex: 1 }}>{detail.title}</h1>
        <button className="btn" onClick={() => void toggleFavorite()}>
          {detail.isFavorite ? "★" : "☆"}
        </button>
        <button className="btn" onClick={() => void rename()}>
          Rename
        </button>
        <button className="btn danger" onClick={() => void trash()}>
          Trash
        </button>
      </div>
      <p className="muted">
        {new Date(detail.recordedAt).toLocaleString()} · {detail.sourceType}
        {detail.languageDominant ? ` · ${detail.languageDominant}` : ""}
        {detail.consentAcknowledged ? " · consent ✓" : ""}
      </p>

      {detail.audioUrl ? (
        <div className="card">
          <audio
            ref={audioRef}
            src={detail.audioUrl}
            controls
            style={{ width: "100%" }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={() => skip(-15)}>
              ⟲ {t("player.back15")}
            </button>
            <button className="btn" onClick={() => skip(15)}>
              {t("player.fwd15")} ⟳
            </button>
            <label className="muted">{t("player.speed")}</label>
            <select
              value={speed}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSpeed(v);
                if (audioRef.current) audioRef.current.playbackRate = v;
              }}
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2, 3].map((v) => (
                <option key={v} value={v}>
                  {v}×
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <p className="muted">Audio is still uploading…</p>
      )}

      {detail.transcript ? (
        <div className="card">
          <TranscriptView
            segments={detail.transcript.segments}
            language={detail.transcript.language}
            speakers={detail.speakers}
            currentTime={currentTime}
            onSeek={seek}
          />
        </div>
      ) : (
        <div className="card">
          <p className="muted">{t("library.transcribing")}</p>
          <button className="btn" onClick={() => void retryTranscription()}>
            Retry transcription
          </button>
        </div>
      )}
    </div>
  );
}
