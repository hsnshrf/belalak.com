"use client";

/**
 * Typed fetch wrapper for the VoiceVault API. Handles bearer tokens and a
 * single transparent refresh on 401. Errors are thrown, never swallowed —
 * recording paths surface every failure to the user.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const ACCESS_KEY = "vv.accessToken";
const REFRESH_KEY = "vv.refreshToken";

export function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return { access: localStorage.getItem(ACCESS_KEY), refresh: localStorage.getItem(REFRESH_KEY) };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn(): boolean {
  return !!getTokens().access;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

async function tryRefresh(): Promise<boolean> {
  const { refresh } = getTokens();
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return false;
  }
  const body = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(body.accessToken, body.refreshToken);
  return true;
}

export async function api<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown; rawBody?: BodyInit } = {},
  retried = false,
): Promise<T> {
  const { access } = getTokens();
  const headers = new Headers(init.headers);
  if (access) headers.set("authorization", `Bearer ${access}`);
  let body: BodyInit | undefined = init.rawBody;
  if (init.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.body);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, body });
  if (res.status === 401 && !retried && (await tryRefresh())) {
    return api<T>(path, init, true);
  }
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text().catch(() => "");
    }
    const message =
      typeof detail === "object" && detail !== null && "message" in detail
        ? String((detail as { message: unknown }).message)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
