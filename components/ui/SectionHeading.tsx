import Reveal from "./Reveal";

type SectionHeadingProps = {
  kicker: string;
  title: string;
  lede?: string;
  /** Tone of the section background, so text colours invert correctly. */
  tone?: "light" | "dark";
  align?: "left" | "center";
};

export default function SectionHeading({
  kicker,
  title,
  lede,
  tone = "light",
  align = "center",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-3xl ${alignClass}`}>
      <Reveal>
        <p className={`kicker ${tone === "dark" ? "text-gold-light" : "text-gold-dark"}`}>
          {kicker}
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          className={`mt-4 font-serif text-4xl leading-[1.08] sm:text-5xl lg:text-6xl text-balance ${
            tone === "dark" ? "text-milk" : "text-deep-900"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.16}>
          <p
            className={`mt-6 text-base sm:text-lg leading-relaxed ${
              tone === "dark" ? "text-deep-100/80" : "text-deep-900/65"
            }`}
          >
            {lede}
          </p>
        </Reveal>
      )}
    </div>
  );
}
