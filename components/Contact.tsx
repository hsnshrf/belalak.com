"use client";

import { useState, type FormEvent } from "react";
import { products } from "@/lib/products";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const VOLUMES = ["Under 25 MT / month", "25 – 100 MT / month", "100 – 500 MT / month", "500+ MT / month"];

type Status = "idle" | "sending" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-milk placeholder:text-deep-100/40 backdrop-blur-sm transition-colors focus:border-gold-light focus:bg-white/15 focus:outline-none";

/**
 * Contact — glassmorphism export-inquiry form posting to /api/contact,
 * plus WhatsApp, email and office cards.
 */
export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Something went wrong.");
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <section id="contact" className="grain relative overflow-hidden bg-gradient-to-b from-deep-900 via-deep-800 to-deep-950 py-28 sm:py-36">
      {/* ambient glows behind the glass */}
      <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-deep-500/30 blur-[120px]" aria-hidden="true" />
      <div className="absolute -right-32 bottom-24 h-96 w-96 rounded-full bg-gold/15 blur-[120px]" aria-hidden="true" />

      <div className="container-site relative">
        <SectionHeading
          kicker="Contact"
          title="Let's talk volumes"
          lede="Tell us what you're formulating and where — our export team replies within one business day."
          tone="dark"
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* inquiry form */}
          <Reveal>
            <form onSubmit={handleSubmit} className="glass rounded-3xl p-7 sm:p-10">
              <h3 className="font-serif text-2xl text-milk">Export Inquiry</h3>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="ct-name" className="mb-2 block text-xs font-medium uppercase tracking-widest text-deep-100/60">
                    Full Name *
                  </label>
                  <input id="ct-name" name="name" required placeholder="Your name" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="ct-company" className="mb-2 block text-xs font-medium uppercase tracking-widest text-deep-100/60">
                    Company Name
                  </label>
                  <input id="ct-company" name="company" placeholder="Company" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="ct-email" className="mb-2 block text-xs font-medium uppercase tracking-widest text-deep-100/60">
                    Work Email *
                  </label>
                  <input id="ct-email" name="email" type="email" required placeholder="name@company.com" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="ct-country" className="mb-2 block text-xs font-medium uppercase tracking-widest text-deep-100/60">
                    Country *
                  </label>
                  <input id="ct-country" name="country" required placeholder="Destination market" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="ct-product" className="mb-2 block text-xs font-medium uppercase tracking-widest text-deep-100/60">
                    Product Inquiry *
                  </label>
                  <select id="ct-product" name="product" required defaultValue="" className={`${inputClass} [&>option]:text-deep-900`}>
                    <option value="" disabled>
                      Select a product
                    </option>
                    {products.map((p) => (
                      <option key={p.slug} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                    <option value="Multiple / Other">Multiple / Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ct-volume" className="mb-2 block text-xs font-medium uppercase tracking-widest text-deep-100/60">
                    Volume Requirement
                  </label>
                  <select id="ct-volume" name="volume" defaultValue="" className={`${inputClass} [&>option]:text-deep-900`}>
                    <option value="" disabled>
                      Estimated volume
                    </option>
                    {VOLUMES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="ct-message" className="mb-2 block text-xs font-medium uppercase tracking-widest text-deep-100/60">
                    Message
                  </label>
                  <textarea
                    id="ct-message"
                    name="message"
                    rows={4}
                    placeholder="Application, target specs, packaging, destination port…"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              <button type="submit" disabled={status === "sending"} className="btn-light mt-8 w-full disabled:cursor-wait disabled:opacity-60">
                {status === "sending" ? "Sending…" : "Send Export Inquiry"}
              </button>

              <div aria-live="polite">
                {status === "success" && (
                  <p className="mt-4 rounded-xl bg-emerald-400/15 px-4 py-3 text-center text-sm text-emerald-200">
                    Thank you — your inquiry is in. Our export team will reply within one business day.
                  </p>
                )}
                {status === "error" && (
                  <p className="mt-4 rounded-xl bg-red-400/15 px-4 py-3 text-center text-sm text-red-200">{error}</p>
                )}
              </div>
            </form>
          </Reveal>

          {/* direct channels */}
          <div className="flex flex-col gap-6">
            <Reveal delay={0.1}>
              <a
                href="https://wa.me/971500000000?text=Hello%20Belalak%20Milk%2C%20I%27d%20like%20to%20inquire%20about%20milk%20powder."
                target="_blank"
                rel="noopener noreferrer"
                className="glass group flex items-center gap-5 rounded-3xl p-6 transition-all duration-300 ease-luxe hover:-translate-y-1 hover:!bg-white/15"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-emerald-300" aria-hidden="true">
                    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5 13.9c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a13 13 0 0 1-1.5-.5c-2.6-1.1-4.3-3.7-4.4-3.9-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2 .2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c0 .2.1.3 0 .5l-.3.5-.4.5c-.2.1-.3.3-.1.6.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.2 2.1 1.3.3.2.5.1.6-.1l.7-.8c.2-.3.4-.2.6-.1l2 .9c.2.2.4.3.5.4 0 .1 0 .7-.2 1.2Z" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-milk">WhatsApp Business</p>
                  <p className="text-sm text-deep-100/60">Instant answers on pricing & availability</p>
                </div>
              </a>
            </Reveal>

            <Reveal delay={0.16}>
              <a
                href="mailto:export@belalak.com?subject=Milk%20Powder%20Export%20Inquiry"
                className="glass group flex items-center gap-5 rounded-3xl p-6 transition-all duration-300 ease-luxe hover:-translate-y-1 hover:!bg-white/15"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/20 font-serif text-2xl text-gold-light">
                  @
                </span>
                <div>
                  <p className="font-semibold text-milk">export@belalak.com</p>
                  <p className="text-sm text-deep-100/60">Specs, COAs & full documentation</p>
                </div>
              </a>
            </Reveal>

            {/* offices / location map */}
            <Reveal delay={0.22}>
              <div className="glass rounded-3xl p-6">
                <p className="kicker text-gold-light">Where We Are</p>
                {/* stylised location strip: Minsk → Dubai corridor */}
                <svg viewBox="0 0 320 110" className="mt-4 w-full" role="img" aria-label="Belalak locations: production in Minsk, distribution in Dubai">
                  <path d="M40 35 Q160 -10 280 75" fill="none" stroke="#C9A96A" strokeWidth="1.5" className="route-draw" />
                  <circle cx="40" cy="35" r="6" fill="#FFF7E8" stroke="#C9A96A" strokeWidth="2.5" />
                  <circle cx="280" cy="75" r="6" fill="#FFF7E8" stroke="#C9A96A" strokeWidth="2.5" />
                  <text x="40" y="62" textAnchor="middle" fontSize="11" fill="#AFC9E5">MINSK</text>
                  <text x="280" y="100" textAnchor="middle" fontSize="11" fill="#AFC9E5">DUBAI</text>
                </svg>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="text-deep-100/75">
                    <span className="font-semibold text-milk">Production · Minsk, Belarus</span>
                    <br /> Sourcing & manufacturing operations
                  </p>
                  <p className="text-deep-100/75">
                    <span className="font-semibold text-milk">Distribution · Dubai, UAE</span>
                    <br /> Export desk & regional logistics hub
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.28}>
              <a href="mailto:export@belalak.com?subject=Request%20for%20Export%20Pricing" className="btn-light w-full text-center">
                Request Export Pricing →
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
