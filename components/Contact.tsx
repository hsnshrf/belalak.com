"use client";

import { useState, type FormEvent } from "react";
import { resolveProductKey, useJourneyState } from "@/lib/journeyState";
import { VARIANT_LIST, VARIANTS } from "@/lib/variants";
import Reveal from "./Reveal";

type Status = "idle" | "sending" | "ok" | "error";

/**
 * RFQ form. Posts to /api/contact (which currently just validates and
 * logs — wire your CRM/email provider there). The product select is
 * prefilled from the journey choices.
 *
 * OWNER: replace export@belalak.com with your real sales inbox.
 */
export default function Contact() {
  const fat = useJourneyState((s) => s.fat);
  const texture = useJourneyState((s) => s.texture);
  const defaultProduct = VARIANTS[resolveProductKey(fat, texture)].name;

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Request failed");
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-steel/25 bg-milk px-3 py-2.5 text-sm text-ink placeholder:text-steel/50 focus:border-steel";

  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-milk py-20 sm:py-28">
      <div className="container-site grid gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="kicker">Request for quotation</p>
          <h2 id="contact-title" className="stage-title mt-3">
            Request a quote or a sample
          </h2>
          <p className="mt-4 max-w-md text-steel">
            Tell us the product, the volume and the destination — we reply
            with pricing, documentation and a shipping plan. Samples are
            available for laboratory evaluation.
          </p>
          <dl className="mt-8 space-y-3 font-mono text-sm">
            <div className="flex gap-4">
              <dt className="w-20 text-steel">EMAIL</dt>
              <dd>
                <a href="mailto:export@belalak.com" className="text-ink underline decoration-cream underline-offset-2">
                  export@belalak.com
                </a>
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-20 text-steel">SUPPLY</dt>
              <dd className="text-ink">FCL · 25 kg bags · worldwide</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-20 text-steel">DOCS</dt>
              <dd className="text-ink">COA per batch · export docs on request</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} className="rounded-2xl border border-steel/15 bg-ivory/60 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rfq-name" className="readout mb-1 block">NAME *</label>
                <input id="rfq-name" name="name" required autoComplete="name" className={inputClass} />
              </div>
              <div>
                <label htmlFor="rfq-company" className="readout mb-1 block">COMPANY</label>
                <input id="rfq-company" name="company" autoComplete="organization" className={inputClass} />
              </div>
              <div>
                <label htmlFor="rfq-email" className="readout mb-1 block">WORK EMAIL *</label>
                <input id="rfq-email" name="email" type="email" required autoComplete="email" className={inputClass} />
              </div>
              <div>
                <label htmlFor="rfq-country" className="readout mb-1 block">COUNTRY *</label>
                <input id="rfq-country" name="country" required autoComplete="country-name" className={inputClass} />
              </div>
              <div>
                <label htmlFor="rfq-product" className="readout mb-1 block">PRODUCT *</label>
                <select
                  id="rfq-product"
                  name="product"
                  required
                  defaultValue={defaultProduct}
                  key={defaultProduct}
                  className={inputClass}
                >
                  {VARIANT_LIST.map((v) => (
                    <option key={v.key} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                  <option value="Other / several">Other / several</option>
                </select>
              </div>
              <div>
                <label htmlFor="rfq-volume" className="readout mb-1 block">MONTHLY VOLUME</label>
                <select id="rfq-volume" name="volume" className={inputClass} defaultValue="">
                  <option value="" disabled>
                    Select…
                  </option>
                  <option>Sample first</option>
                  <option>1 – 5 t</option>
                  <option>5 – 20 t</option>
                  <option>20 – 100 t</option>
                  <option>100 t +</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="rfq-message" className="readout mb-1 block">MESSAGE</label>
                <textarea id="rfq-message" name="message" rows={4} className={inputClass} placeholder="Specs, destination port, target price…" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button type="submit" disabled={status === "sending"} className="btn-primary disabled:opacity-60">
                {status === "sending" ? "Sending…" : "Send inquiry"}
              </button>
              <a href="mailto:export@belalak.com" className="readout underline decoration-cream underline-offset-2">
                OR EMAIL DIRECTLY
              </a>
            </div>

            <p aria-live="polite" className="mt-4 min-h-5 font-mono text-xs">
              {status === "ok" && (
                <span className="text-pasture">✓ Inquiry received — we&apos;ll reply within one business day.</span>
              )}
              {status === "error" && <span className="text-cream">✗ {error} — please email us directly.</span>}
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
