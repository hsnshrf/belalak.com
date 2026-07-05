"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setTokens } from "@/lib/api-client";

/** OAuth landing: tokens arrive in the URL fragment (never logged server-side). */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    if (access && refresh) {
      setTokens(access, refresh);
      window.location.hash = "";
      router.replace("/");
    } else {
      setError("Sign-in failed: no tokens returned. Try again.");
    }
  }, [router]);

  return <div className="card">{error ? <p className="error">{error}</p> : <p>Signing you in…</p>}</div>;
}
