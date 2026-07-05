"use client";

import type { Category, Folder, Tag } from "@voicevault/shared";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

/**
 * Folder / category / tags editor for one recording, plus AI suggestions.
 * Suggestions are chips the user must click to apply — never auto-applied.
 */
export function OrganizePanel(props: {
  recordingId: string;
  folderId: string | null;
  categoryId: string | null;
  tagIds: string[];
  onChanged(): void;
}) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    void Promise.all([
      api<Folder[]>("/v1/folders").then(setFolders),
      api<Category[]>("/v1/categories").then(setCategories),
      api<Tag[]>("/v1/tags").then(setTags),
    ]).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!tagQuery.trim()) {
      setTagOptions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void api<Tag[]>(`/v1/tags?q=${encodeURIComponent(tagQuery.trim())}`).then(setTagOptions);
    }, 250);
  }, [tagQuery]);

  const patch = async (body: Record<string, unknown>) => {
    try {
      await api(`/v1/recordings/${props.recordingId}`, { method: "PATCH", body });
      props.onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const addTag = async (name: string) => {
    const tag = await api<Tag>("/v1/tags", { method: "POST", body: { name } });
    setTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
    await patch({ tagIds: [...new Set([...props.tagIds, tag.id])] });
    setTagQuery("");
    setTagOptions([]);
  };

  const removeTag = (tagId: string) => patch({ tagIds: props.tagIds.filter((t) => t !== tagId) });

  const suggest = async () => {
    setSuggesting(true);
    setError(null);
    try {
      const res = await api<{ content: { tags?: string[] } }>(
        `/v1/recordings/${props.recordingId}/ai/tag_suggestions`,
        { method: "POST" },
      );
      const current = new Set(
        props.tagIds.map((id) => tags.find((t) => t.id === id)?.name.toLowerCase()).filter(Boolean),
      );
      setSuggestions((res.content.tags ?? []).filter((s) => !current.has(s.toLowerCase())));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSuggesting(false);
    }
  };

  const tagName = (id: string) => tags.find((t) => t.id === id)?.name ?? "…";

  return (
    <div className="card">
      <div className="row">
        <label className="muted">Folder</label>
        <select
          value={props.folderId ?? ""}
          onChange={(e) => void patch({ folderId: e.target.value || null })}
        >
          <option value="">—</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {folderPath(f, folders)}
            </option>
          ))}
        </select>

        <label className="muted">Category</label>
        <select
          value={props.categoryId ?? ""}
          onChange={(e) => void patch({ categoryId: e.target.value || null })}
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <label className="muted">Tags</label>
        {props.tagIds.map((id) => (
          <span key={id} className="badge">
            {tagName(id)}{" "}
            <button
              style={{ background: "none", border: "none", color: "inherit" }}
              aria-label={`Remove tag ${tagName(id)}`}
              onClick={() => void removeTag(id)}
            >
              ×
            </button>
          </span>
        ))}
        <span style={{ position: "relative" }}>
          <input
            placeholder="add tag…"
            value={tagQuery}
            dir="auto"
            onChange={(e) => setTagQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagQuery.trim()) {
                e.preventDefault();
                void addTag(tagQuery.trim());
              }
            }}
            style={{ background: "var(--panel-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px" }}
          />
          {tagOptions.length > 0 && (
            <span style={{ position: "absolute", top: "110%", insetInlineStart: 0, zIndex: 5, background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 4, display: "flex", flexDirection: "column" }}>
              {tagOptions.map((t) => (
                <button key={t.id} className="btn" style={{ border: "none", textAlign: "start" }} onClick={() => void addTag(t.name)}>
                  {t.name}
                </button>
              ))}
            </span>
          )}
        </span>
        <button className="btn" onClick={() => void suggest()} disabled={suggesting}>
          {suggesting ? "Suggesting…" : "✨ Suggest tags"}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="row" style={{ marginTop: 8 }}>
          <span className="muted">Suggested (click to apply):</span>
          {suggestions.map((s) => (
            <button
              key={s}
              className="btn"
              onClick={() => {
                void addTag(s);
                setSuggestions((prev) => prev.filter((x) => x !== s));
              }}
            >
              + {s}
            </button>
          ))}
          <button className="btn" onClick={() => setSuggestions([])}>
            Dismiss
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}

function folderPath(folder: Folder, all: Folder[]): string {
  const parts = [folder.name];
  let parent = all.find((f) => f.id === folder.parentId);
  for (let depth = 0; parent && depth < 20; depth++) {
    parts.unshift(parent.name);
    parent = all.find((f) => f.id === parent!.parentId);
  }
  return parts.join(" / ");
}
