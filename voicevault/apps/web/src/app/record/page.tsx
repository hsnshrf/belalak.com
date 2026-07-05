"use client";

import type { QualityPreset } from "@voicevault/shared";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ConsentDialog } from "@/components/ConsentDialog";
import { Waveform } from "@/components/Waveform";
import {
  captureMicrophone,
  captureTabAndMic,
  tabAudioSupport,
  type CaptureHandle,
} from "@/lib/audio/capture";
import { RecordingSession } from "@/lib/audio/recorder";
import { useI18n } from "@/lib/i18n";

type Source = "mic" | "meeting" | "call";

/**
 * Capture strategies offered on web (honest per-platform):
 *  - mic:      plain microphone
 *  - meeting:  tab audio (getDisplayMedia) mixed with mic — Chrome/Edge; the
 *              Safari/Firefox limitation is displayed, not hidden
 *  - call:     browser/WebRTC calls via the same tab-audio path; cellular
 *              calls are out of scope on web
 */
export default function RecordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [source, setSource] = useState<Source>("mic");
  const [quality, setQuality] = useState<QualityPreset>("standard");
  const [phase, setPhase] = useState<"idle" | "consent" | "recording" | "finishing">("idle");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [lastChunk, setLastChunk] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<RecordingSession | null>(null);

  const support = typeof window !== "undefined" ? tabAudioSupport() : { supported: false, note: "" };

  function begin() {
    setError(null);
    if (source === "mic") {
      void start({ consentAcknowledged: false, playAnnouncement: false });
    } else {
      setPhase("consent"); // consent reminder is mandatory for meetings/calls
    }
  }

  async function start(consent: { consentAcknowledged: boolean; playAnnouncement: boolean }) {
    try {
      let capture: CaptureHandle;
      if (source === "meeting") {
        capture = await captureTabAndMic();
      } else {
        capture = await captureMicrophone();
      }
      if (consent.playAnnouncement) await playAnnouncementTone();

      const session = new RecordingSession(
        {
          capture,
          qualityPreset: quality,
          sourceType: source,
          consentAcknowledged: consent.consentAcknowledged,
          announcementPlayed: consent.playAnnouncement,
        },
        {
          onElapsed: setElapsed,
          onLevel: setLevel,
          onChunkUploaded: setLastChunk,
          onError: (err) => {
            setError(err.message);
            setPhase("idle");
          },
          onComplete: (recordingId) => router.push(`/recordings/${recordingId}`),
        },
      );
      sessionRef.current = session;
      await session.start();
      setPhase("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("idle");
    }
  }

  async function stop() {
    setPhase("finishing");
    await sessionRef.current?.stop();
  }

  return (
    <div>
      <h1>{t("record.start")}</h1>

      {phase === "idle" && (
        <div className="card">
          <div className="field">
            <label>Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value as Source)}>
              <option value="mic">{t("record.source.mic")}</option>
              <option value="meeting">{t("record.source.meeting")}</option>
              <option value="call">{t("record.source.call")}</option>
            </select>
          </div>
          {source === "meeting" && (
            <p className={support.supported ? "muted" : "error"}>
              {support.note} {support.supported && t("record.meetingHowTo")}
            </p>
          )}
          <div className="field">
            <label>{t("record.quality")}</label>
            <select value={quality} onChange={(e) => setQuality(e.target.value as QualityPreset)}>
              <option value="voice">{t("record.quality.voice")}</option>
              <option value="standard">{t("record.quality.standard")}</option>
              <option value="high">{t("record.quality.high")}</option>
            </select>
          </div>
          <div className="row" style={{ justifyContent: "center", marginBlock: 24 }}>
            <button className="btn record" onClick={begin} disabled={source === "meeting" && !support.supported}>
              REC
            </button>
          </div>
        </div>
      )}

      {phase === "consent" && (
        <ConsentDialog
          onCancel={() => setPhase("idle")}
          onConfirm={(result) => void start(result)}
        />
      )}

      {(phase === "recording" || phase === "finishing") && (
        <div className="card" style={{ textAlign: "center" }}>
          <div className="timer">{formatElapsed(elapsed)}</div>
          <Waveform level={level} running={phase === "recording" && !paused} />
          <p className="muted">
            {lastChunk !== null ? `${t("record.chunkSaved")} #${lastChunk + 1}` : "…"}
          </p>
          <div className="row" style={{ justifyContent: "center" }}>
            <button
              className="btn"
              onClick={() => {
                if (paused) sessionRef.current?.resume();
                else sessionRef.current?.pause();
                setPaused(!paused);
              }}
              disabled={phase === "finishing"}
            >
              {paused ? t("record.resume") : t("record.pause")}
            </button>
            <button className="btn primary" onClick={() => void stop()} disabled={phase === "finishing"}>
              {phase === "finishing" ? t("record.uploading") : t("record.stop")}
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}

/** Simple two-tone "recording started" announcement chirp. */
async function playAnnouncementTone(): Promise<void> {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain).connect(ctx.destination);
  gain.gain.value = 0.15;
  osc.frequency.value = 880;
  osc.start();
  await new Promise((r) => setTimeout(r, 180));
  osc.frequency.value = 1320;
  await new Promise((r) => setTimeout(r, 180));
  osc.stop();
  await ctx.close();
}

function formatElapsed(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
