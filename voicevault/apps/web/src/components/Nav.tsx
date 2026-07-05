"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearTokens, isLoggedIn } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n";

export function Nav() {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => setAuthed(isLoggedIn()), [pathname]);

  const link = (href: string, label: string) => (
    <Link href={href} className={pathname === href ? "active" : ""}>
      {label}
    </Link>
  );

  return (
    <nav className="topnav">
      <Link href="/" className="brand">
        {t("app.name")}
      </Link>
      {authed && (
        <>
          {link("/", t("nav.library"))}
          {link("/record", t("nav.record"))}
          {link("/search", t("nav.search"))}
          {link("/settings", t("nav.settings"))}
        </>
      )}
      <span className="spacer" />
      <button
        className="btn"
        aria-label="Switch language"
        onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      >
        {locale === "en" ? "العربية" : "English"}
      </button>
      {authed && (
        <button
          className="btn"
          onClick={() => {
            clearTokens();
            router.push("/login");
          }}
        >
          {t("nav.logout")}
        </button>
      )}
    </nav>
  );
}
