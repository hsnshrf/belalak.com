"use client";

import type { CaptureStrategy, QualityPreset } from "@voicevault/shared";
import { QUALITY_PRESETS } from "@voicevault/shared";

/**
 * Audio capture for the web app.
 *
 * Strategy "mic":       getUserMedia microphone.
 * Strategy "tab_audio": getDisplayMedia({audio:true}) — the user shares the
 *                       meeting tab/window WITH audio; we mix that with the
 *                       mic so both sides of the conversation are captured.
 *
 * Browser reality (surfaced in the UI, never hidden):
 *  - Chrome/Edge: tab audio works (choose "Chrome Tab" + "Share tab audio").
 *  - Firefox: getDisplayMedia audio is generally unavailable.
 *  - Safari: does not provide tab/system audio; speakerphone+mic is the
 *    honest fallback there.
 */

export interface TabAudioSupport {
  supported: boolean;
  /** Human-readable caveat to show next to the capture selector. */
  note: string;
}

export function tabAudioSupport(): TabAudioSupport {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    return { supported: false, note: "Screen sharing is not available in this browser." };
  }
  const ua = navigator.userAgent;
  const isChromium = "chrome" in window || /Edg\//.test(ua);
  if (isChromium) {
    return {
      supported: true,
      note: 'Pick the meeting tab and enable "Also share tab audio" in the share dialog.',
    };
  }
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
    return {
      supported: false,
      note: "Safari cannot capture tab or system audio. Use Chrome/Edge, or record via microphone with the meeting on speakers.",
    };
  }
  return {
    supported: false,
    note: "This browser may not deliver tab audio. Chrome or Edge are recommended for meeting capture.",
  };
}

export interface CaptureHandle {
  /** The mixed stream to feed the recorder. */
  stream: MediaStream;
  /** Analyser for live waveform rendering. */
  analyser: AnalyserNode;
  strategy: CaptureStrategy;
  stop(): void;
}

export async function captureMicrophone(): Promise<CaptureHandle> {
  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  return wire([mic], "mic", [mic]);
}

/**
 * Meeting capture: display (tab) audio mixed with the microphone.
 * Throws with a user-actionable message when the user shares without audio.
 */
export async function captureTabAndMic(): Promise<CaptureHandle> {
  const display = await navigator.mediaDevices.getDisplayMedia({
    video: true, // required by the API even though we only keep audio
    audio: true,
  });
  if (display.getAudioTracks().length === 0) {
    display.getTracks().forEach((t) => t.stop());
    throw new Error(
      'No tab audio was shared. Re-share and tick "Also share tab audio" (Chrome/Edge; tab sharing, not window/screen, is most reliable).',
    );
  }
  let mic: MediaStream | null = null;
  try {
    mic = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    // Mic denied — still record the meeting side; the UI shows a warning.
  }
  const sources = mic ? [display, mic] : [display];
  const handle = wire(sources, "tab_audio", [display, ...(mic ? [mic] : [])]);
  // If the user stops sharing via the browser UI, end the capture cleanly.
  display.getVideoTracks()[0]?.addEventListener("ended", () => handle.stop());
  return handle;
}

/** Mix N input streams into one mono-ish stream + analyser via WebAudio. */
function wire(sources: MediaStream[], strategy: CaptureStrategy, owned: MediaStream[]): CaptureHandle {
  const ctx = new AudioContext();
  const destination = ctx.createMediaStreamDestination();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  for (const s of sources) {
    const node = ctx.createMediaStreamSource(s);
    node.connect(destination);
    node.connect(analyser);
  }
  return {
    stream: destination.stream,
    analyser,
    strategy,
    stop() {
      owned.flatMap((s) => s.getTracks()).forEach((t) => t.stop());
      void ctx.close();
    },
  };
}

/** Preferred MediaRecorder mime + bitrate for a quality preset. */
export function recorderOptions(preset: QualityPreset): { mimeType: string; audioBitsPerSecond: number } {
  const { bitrateKbps, codec } = QUALITY_PRESETS[preset];
  const candidates =
    codec === "aac"
      ? ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
      : ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];
  const mimeType =
    typeof MediaRecorder !== "undefined"
      ? candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? ""
      : "";
  return { mimeType, audioBitsPerSecond: bitrateKbps * 1000 };
}
