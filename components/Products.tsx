"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { products, type Product } from "@/lib/products";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

function DropMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 6c8 12 15 20 15 29a15 15 0 1 1-30 0c0-9 7-17 15-29z" fill="currentColor" />
    </svg>
  );
}

/** Stylised packaging mockup built from gradients — no image assets needed. */
function BagMockup({ product }: { product: Product }) {
  return (
    <div className="relative mx-auto h-56 w-44 transition-transform duration-500 ease-luxe group-hover:-translate-y-2 group-hover:rotate-1">
      {/* bag body */}
      <div className={`relative h-full w-full overflow-hidden rounded-2xl border border-silver/60 bg-gradient-to-br shadow-lg ${product.bagGradient}`}>
        {/* top crimp */}
        <div className="absolute inset-x-[-6px] top-0 h-6 rounded-b-sm bg-deep" />
        {/* label */}
        <div className="absolute inset-x-3 top-12 flex flex-col items-center text-center">
          <DropMark className="h-6 w-6 text-deep" />
          <p className="mt-2 font-serif text-sm tracking-[0.3em] text-deep">BELALAK</p>
          <div className="mt-2 h-px w-16" style={{ backgroundColor: product.accent }} />
          <p className="mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-deep-700">
            {product.name}
          </p>
          <p className="mt-3 text-[0.55rem] uppercase tracking-widest text-deep-700/60">Net 25 kg</p>
        </div>
        {/* sheen on hover */}
        <div className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:animate-shimmer group-hover:opacity-100" />
      </div>
      {/* ground shadow */}
      <div className="absolute -bottom-3 left-1/2 h-3 w-32 -translate-x-1/2 rounded-full bg-deep/15 blur-md transition-all duration-500 group-hover:w-36 group-hover:bg-deep/25" />
    </div>
  );
}

function SpecModal({ product, onClose }: { product: Product; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} technical specifications`}
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close specifications"
        className="absolute inset-0 cursor-default bg-deep-950/70 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl !bg-white/95 p-7 shadow-2xl sm:p-10"
        data-lenis-prevent
      >
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Close"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-silver text-deep transition-colors hover:bg-deep hover:text-milk"
        >
          ✕
        </button>

        <p className="kicker text-gold-dark">Technical Specifications</p>
        <h3 className="mt-3 font-serif text-3xl text-deep-900">{product.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-deep-900/65">{product.description}</p>

        <table className="mt-7 w-full text-sm">
          <tbody>
            {product.specs.map((spec) => (
              <tr key={spec.label} className="border-b border-silver/50 last:border-0">
                <th scope="row" className="py-3 pr-4 text-left font-medium text-deep-900/60">
                  {spec.label}
                </th>
                <td className="py-3 text-right font-semibold text-deep-900">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-7 flex flex-wrap gap-2">
          {product.applications.map((app) => (
            <span key={app} className="rounded-full bg-cream px-3.5 py-1.5 text-xs font-medium text-deep-800">
              {app}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={product.specSheet} download className="btn-primary flex-1 text-center">
            Download Spec Sheet (PDF)
          </a>
          <a href="#contact" onClick={onClose} className="btn-ghost flex-1 text-center text-deep">
            Request a Sample
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Products() {
  const [active, setActive] = useState<Product | null>(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <section id="products" className="bg-milk py-28 sm:py-36">
      <div className="container-site">
        <SectionHeading
          kicker="Our Products"
          title="Premium dairy ingredients, engineered to perform"
          lede="Four core powders covering the full spectrum of industrial dairy applications — every bag traceable to Belarusian farms."
        />

        <div className="mt-16 grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.slug} delay={i * 0.08}>
              <article className="group relative flex h-full flex-col rounded-3xl border border-silver/50 bg-white p-7 transition-all duration-500 ease-luxe hover:-translate-y-2 hover:border-gold/40 hover:shadow-2xl hover:shadow-deep/10">
                {/* origin badge */}
                <span className="absolute right-5 top-5 z-10 rounded-full bg-deep px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-widest text-cream">
                  Made in Belarus
                </span>

                <div className="pt-6">
                  <BagMockup product={product} />
                </div>

                <h3 className="mt-8 font-serif text-2xl text-deep-900">{product.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-deep-900/60">{product.tagline}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {product.applications.map((app) => (
                    <span key={app} className="rounded-full bg-cream px-3 py-1 text-[0.7rem] font-medium text-deep-800">
                      {app}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex gap-2 pt-7">
                  <button type="button" onClick={() => setActive(product)} className="btn-primary flex-1 !px-4 !py-2.5 text-xs">
                    Specifications
                  </button>
                  <a
                    href={product.specSheet}
                    download
                    aria-label={`Download ${product.name} specification sheet`}
                    className="btn-ghost !px-4 !py-2.5 text-xs text-deep"
                  >
                    PDF ↓
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>{active && <SpecModal product={active} onClose={close} />}</AnimatePresence>
    </section>
  );
}
