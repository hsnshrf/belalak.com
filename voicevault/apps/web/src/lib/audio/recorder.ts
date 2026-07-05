"use client";

import { MAX_RECORDING_SECONDS, UPLOAD_CHUNK_SECONDS, type QualityPreset } from "@voicevault/shared";
import { api } from "../api-client";
import type { CaptureHandle } from "./capture";
import { recorderOptions } from "./capture";

/**
 * Recording session: MediaRecorder with a 5-minute timeslice; every slice is
 * uploaded as soon as it lands, so a connectivity/tab loss costs at most one
 * chunk. Chunks of one MediaRecorder session are slices of a single continuous
 * encoded stream, so the server can concatenate them byte-wise.
 *
 * Every failure path calls onError — audio loss is never silent.
 */

export interface RecorderCallbacks {
  onElapsed(seconds: number): void;
  onLevel(level: number): void;
  onChunkUploaded(seq: number): void;
  onError(err: Error): void;
  onComplete(recordingId: string): void;
}

export interface StartOptions {
  capture: CaptureHandle;
  qualityPreset: QualityPreset;
  sourceType: "mic" | "meeting" | "call";
  consentAcknowledged: boolean;
  announcementPlayed: boolean;
  title?: string;
}

interface OpenedRecording {
  recordingId: string;
  sessionId: string;
}

export class RecordingSession {
  private recorder: MediaRecorder | null = null;
  private opened: OpenedRecording | null = null;
  private seq = 0;
  private pendingUploads: Promise<void>[] = [];
  private startedAt = 0;
  private pausedMs = 0;
  private pauseStartedAt = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stopped = false;

  constructor(
    private readonly opts: StartOptions,
    private readonly cb: RecorderCallbacks,
  ) {}

  get isPaused(): boolean {
    return this.recorder?.state === "paused";
  }

  async start(): Promise<void> {
    const { mimeType, audioBitsPerSecond } = recorderOptions(this.opts.qualityPreset);
    const clientId = crypto.randomUUID();
    const recording = await api<{ id: string }>("/v1/recordings", {
      method: "POST",
      body: {
        clientId,
        sourceType: this.opts.sourceType,
        captureStrategy: this.opts.capture.strategy,
        qualityPreset: this.opts.qualityPreset,
        recordedAt: new Date().toISOString(),
        consentAcknowledged: this.opts.consentAcknowledged,
        announcementPlayed: this.opts.announcementPlayed,
        ...(this.opts.title ? { title: this.opts.title } : {}),
      },
    });
    const session = await api<{ sessionId: string }>("/v1/uploads/sessions", {
      method: "POST",
      body: { recordingId: recording.id, mimeType: mimeType || "audio/webm" },
    });
    this.opened = { recordingId: recording.id, sessionId: session.sessionId };

    this.recorder = new MediaRecorder(this.opts.capture.stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond,
    });
    this.recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) this.uploadChunk(ev.data, this.recorder!.state === "inactive");
    };
    this.recorder.onerror = () => this.cb.onError(new Error("Recorder error — recording stopped"));
    this.recorder.start(UPLOAD_CHUNK_SECONDS * 1000);
    this.startedAt = Date.now();

    this.timer = setInterval(() => {
      const elapsed = this.elapsedSeconds();
      this.cb.onElapsed(elapsed);
      this.cb.onLevel(this.currentLevel());
      if (elapsed >= MAX_RECORDING_SECONDS) void this.stop();
    }, 250);
  }

  pause(): void {
    if (this.recorder?.state === "recording") {
      this.recorder.pause();
      this.pauseStartedAt = Date.now();
    }
  }

  resume(): void {
    if (this.recorder?.state === "paused") {
      this.recorder.resume();
      this.pausedMs += Date.now() - this.pauseStartedAt;
    }
  }

  /** Stop, flush the final chunk, complete the session. */
  async stop(): Promise<void> {
    if (this.stopped || !this.recorder || !this.opened) return;
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);

    const flushed = new Promise<void>((resolve) => {
      this.recorder!.onstop = () => resolve();
    });
    this.recorder.stop();
    await flushed;
    this.opts.capture.stop();

    try {
      await Promise.all(this.pendingUploads);
      const done = await api<{ recordingId: string }>(
        `/v1/uploads/sessions/${this.opened.sessionId}/complete`,
        { method: "POST" },
      );
      this.cb.onComplete(done.recordingId);
    } catch (err) {
      this.cb.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private elapsedSeconds(): number {
    const pausedNow = this.isPaused ? Date.now() - this.pauseStartedAt : 0;
    return Math.floor((Date.now() - this.startedAt - this.pausedMs - pausedNow) / 1000);
  }

  private currentLevel(): number {
    const analyser = this.opts.capture.analyser;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (const v of data) sum += (v - 128) * (v - 128);
    return Math.min(1, Math.sqrt(sum / data.length) / 64);
  }

  private uploadChunk(blob: Blob, isLast: boolean): void {
    const mySeq = this.seq++;
    const task = (async () => {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
      // Up to 4 attempts with exponential backoff — then fail loudly.
      let lastErr: unknown;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await api(`/v1/uploads/sessions/${this.opened!.sessionId}/chunks/${mySeq}`, {
            method: "PUT",
            headers: {
              "content-type": "application/octet-stream",
              "x-chunk-sha256": sha256,
              "x-chunk-is-last": String(isLast),
            },
            rawBody: bytes,
          });
          this.cb.onChunkUploaded(mySeq);
          return;
        } catch (err) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error(`chunk ${mySeq} upload failed`);
    })().catch((err: Error) => {
      this.cb.onError(new Error(`Chunk ${mySeq} could not be uploaded: ${err.message}`));
      throw err;
    });
    this.pendingUploads.push(task);
  }
}
