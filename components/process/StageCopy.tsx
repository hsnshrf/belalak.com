type StageCopyProps = {
  index: number;
  kicker: string;
  title: string;
  text: string;
  tone: "light" | "dark";
};

/**
 * Shared copy block for the six process stages. The wrapping `.stage-copy`
 * class is the hook each stage's GSAP timeline uses for its entrance.
 */
export default function StageCopy({ index, kicker, title, text, tone }: StageCopyProps) {
  const dark = tone === "dark";
  return (
    <div className="stage-copy max-w-xl">
      <p className={`kicker ${dark ? "text-gold-light" : "text-gold-dark"}`}>
        Stage {String(index).padStart(2, "0")} — {kicker}
      </p>
      <h3
        className={`mt-4 font-serif text-3xl leading-tight sm:text-4xl lg:text-[2.75rem] text-balance ${
          dark ? "text-milk" : "text-deep-900"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-5 text-base leading-relaxed sm:text-lg ${
          dark ? "text-deep-100/75" : "text-deep-900/65"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
