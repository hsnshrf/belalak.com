import PhotoSlot from "./PhotoSlot";
import Reveal from "./Reveal";

/**
 * Why Belarus — deliberately short and generic. Anything a lawyer or
 * customer could ask for evidence of is marked for the owner to verify.
 */
const PILLARS = [
  {
    title: "Dairy heritage",
    body: "Dairy is one of Belarus's flagship agricultural sectors, with a dense farm network, generations of herd-management practice and a long record of exporting milk products.",
    /* OWNER: verify claim — add concrete export figures only from an official source */
  },
  {
    title: "Feed & climate",
    body: "A temperate climate, reliable rainfall and abundant natural pasture support consistent, high-quality forage — and consistent milk composition across the season.",
  },
  {
    title: "Standards & oversight",
    body: "Farms operate under state veterinary supervision; processing follows HACCP-based food-safety systems with batch-level traceability from farm to bag.",
    /* OWNER: verify claim — list specific certifications (ISO 22000, HALAL, …) ONLY if currently held */
  },
];

export default function WhyBelarus() {
  return (
    <section id="why-belarus" aria-labelledby="why-belarus-title" className="bg-milk py-20 sm:py-28">
      <div className="container-site">
        <Reveal>
          <p className="kicker">Origin</p>
          <h2 id="why-belarus-title" className="stage-title mt-3">
            Why Belarus
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.08}>
              <article className="h-full rounded-xl border border-steel/15 bg-ivory/60 p-6">
                <span className="readout !text-cream">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-xl font-bold text-ink">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-steel">{pillar.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="mt-8">
          <PhotoSlot
            className="h-40 sm:h-56"
            alt="Summer pasture in Belarus with grazing Holstein cows and a birch grove on the horizon"
            searchHint="Belarus countryside pasture cows birch summer"
          />
        </Reveal>
      </div>
    </section>
  );
}
