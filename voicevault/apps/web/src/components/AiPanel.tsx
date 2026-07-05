"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";

type Kind = "summary" | "action_items" | "key_topics";

interface Artifact {
  kind: Kind;
  content: {
    summary?: string;
    actionItems?: { text: string; owner?: string | null; due?: string | null }[];
    topics?: string[];
  };
}

/** On-demand AI post-processing: summary, action items, key topics. */
export function AiPanel({ recordingId }: { recordingId: string }) {
  const [artifacts, setArtifacts] = useState<Partial<Record<Kind, Artifact>>>({});
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(kind: Kind) {
    setBusy(kind);
    setError(null);
    try {
      const res = await api<Artifact>(`/v1/recordings/${recordingId}/ai/${kind}`, { method: "POST" });
      setArtifacts((prev) => ({ ...prev, [kind]: res }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card">
      <div className="row">
        <button className="btn" disabled={busy !== null} onClick={() => void generate("summary")}>
          {busy === "summary" ? "…" : "📝 Summary"}
        </button>
        <button className="btn" disabled={busy !== null} onClick={() => void generate("action_items")}>
          {busy === "action_items" ? "…" : "✅ Action items"}
        </button>
        <button className="btn" disabled={busy !== null} onClick={() => void generate("key_topics")}>
          {busy === "key_topics" ? "…" : "🏷 Key topics"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {artifacts.summary && <p dir="auto">{artifacts.summary.content.summary}</p>}
      {artifacts.action_items && (
        <ul>
          {(artifacts.action_items.content.actionItems ?? []).map((a, i) => (
            <li key={i} dir="auto">
              {a.text}
              {a.owner ? ` — ${a.owner}` : ""}
              {a.due ? ` (${a.due})` : ""}
            </li>
          ))}
        </ul>
      )}
      {artifacts.key_topics && (
        <div className="row">
          {(artifacts.key_topics.content.topics ?? []).map((topic) => (
            <span key={topic} className="badge" dir="auto">
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
