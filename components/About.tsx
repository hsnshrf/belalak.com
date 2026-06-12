import Reveal from "@/components/ui/Reveal";

const VALUES = [
  { title: "Commitment to Quality", text: "Every batch is tested, certified and traceable — because our customers build their own brands on our consistency." },
  { title: "Belarusian Dairy Heritage", text: "Generations of dairy craft meet modern food technology in one of the world's great milk-producing nations." },
  { title: "International Standards", text: "ISO- and HACCP-governed production, with documentation that satisfies the strictest import authorities." },
  { title: "Trusted Ingredient Supplier", text: "Food manufacturers across four continents rely on Belalak powders as the foundation of their products." },
];

/** About — the brand story, told with large editorial typography. */
export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-cream py-28 sm:py-40">
      {/* oversized watermark drop */}
      <svg
        viewBox="0 0 64 64"
        className="pointer-events-none absolute -right-24 top-10 h-[34rem] w-[34rem] text-deep/5 animate-float-slower"
        aria-hidden="true"
      >
        <path d="M32 6c8 12 15 20 15 29a15 15 0 1 1-30 0c0-9 7-17 15-29z" fill="currentColor" />
      </svg>

      <div className="container-site relative">
        <div className="max-w-4xl">
          <Reveal>
            <p className="kicker text-gold-dark">About Belalak Milk</p>
          </Reveal>
          <Reveal delay={0.1}>
            <blockquote className="mt-6 font-serif text-3xl leading-snug text-deep-900 sm:text-5xl sm:leading-tight text-balance">
              “We exist for one reason: to carry the purity of Belarusian milk,
              <span className="italic text-gold-dark"> unchanged</span>, into every
              product our customers make.”
            </blockquote>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-10 max-w-2xl text-base leading-relaxed text-deep-900/70 sm:text-lg">
              Belalak Milk is a premium dairy ingredients brand sourcing and manufacturing
              high-quality milk powders in the Republic of Belarus. We pair the country&apos;s
              extraordinary raw-milk supply with advanced processing technology and the
              discipline of European food standards — then deliver it to manufacturers
              worldwide with the transparency modern supply chains demand.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-7 sm:grid-cols-2">
          {VALUES.map((value, i) => (
            <Reveal key={value.title} delay={i * 0.08}>
              <div className="flex h-full gap-5 rounded-3xl border border-silver/50 bg-white/70 p-7 backdrop-blur-sm">
                <span className="font-serif text-4xl text-gold/70">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-serif text-xl text-deep-900">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-deep-900/65">{value.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
