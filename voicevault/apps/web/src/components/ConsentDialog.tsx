"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Shown before every call/meeting recording (required, not optional).
 * The acknowledgment toggle value is stored with the recording's metadata;
 * the announcement toggle defaults ON for call/meeting modes.
 */
export function ConsentDialog(props: {
  onCancel(): void;
  onConfirm(result: { consentAcknowledged: boolean; playAnnouncement: boolean }): void;
}) {
  const { t } = useI18n();
  const [ack, setAck] = useState(false);
  const [announce, setAnnounce] = useState(true);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="card modal">
        <h2 id="consent-title">{t("consent.title")}</h2>
        <p className="muted">{t("consent.body")}</p>
        <label className="row" style={{ marginBlock: 12 }}>
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          <span>{t("consent.ack")}</span>
        </label>
        <label className="row" style={{ marginBlock: 12 }}>
          <input type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} />
          <span>{t("consent.announce")}</span>
        </label>
        <p>
          <Link href="/settings/consent" className="muted" style={{ textDecoration: "underline" }}>
            {t("consent.learnMore")}
          </Link>
        </p>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn" onClick={props.onCancel}>
            {t("consent.cancel")}
          </button>
          <button
            className="btn primary"
            onClick={() => props.onConfirm({ consentAcknowledged: ack, playAnnouncement: announce })}
          >
            {t("consent.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
