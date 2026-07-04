import type { ReactNode } from "react";

/**
 * Shared copy block for every stage: honest mono numbering, display title,
 * plain B2B body copy. Each stage wraps this in its own layout.
 */
export default function StageCopy({
  id,
  num,
  kicker,
  title,
  children,
  dark = false,
}: {
  id: string;
  num: string;
  kicker: string;
  title: string;
  children: ReactNode;
  /** invert text colors on dark stage backgrounds */
  dark?: boolean;
}) {
  return (
    <div className="stage-copy max-w-md">
      <p className="stage-num">
        STAGE {num} / 09 <span aria-hidden="true">·</span>{" "}
        <span className={dark ? "text-milk/60" : "text-steel"}>{kicker}</span>
      </p>
      <h2
        id={`${id}-title`}
        className={`stage-title mt-3 ${dark ? "!text-milk" : ""}`}
      >
        {title}
      </h2>
      <div
        className={`mt-4 space-y-3 text-[0.95rem] leading-relaxed ${
          dark ? "text-milk/80" : "text-steel"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
