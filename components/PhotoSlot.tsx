/**
 * OWNER: PHOTOGRAPHY PLACEHOLDER
 * ------------------------------------------------------------------
 * Drop licensed photography here. Replace this component's frame with:
 *
 *   import Image from "next/image";
 *   <Image
 *     src="/photos/<your-file>.jpg"
 *     alt={alt}
 *     width={800}
 *     height={600}
 *     className="h-full w-full rounded-lg object-cover"
 *   />
 *
 * The `searchHint` prop suggests stock-photo search terms for sourcing.
 */
export default function PhotoSlot({
  alt,
  searchHint,
  className = "",
}: {
  /** the alt text the final photo should carry */
  alt: string;
  /** recommended stock-photo search terms */
  searchHint: string;
  className?: string;
}) {
  return (
    <figure
      role="img"
      aria-label={alt}
      className={`relative overflow-hidden rounded-lg border border-dashed border-steel/40 bg-ivory/60 ${className}`}
    >
      <div className="flex h-full min-h-24 flex-col justify-end gap-1 p-3">
        <span className="readout !text-[0.6rem] uppercase tracking-kicker text-steel/70">
          Photo slot
        </span>
        <figcaption className="font-mono text-[0.65rem] leading-snug text-steel">
          {alt}
          <span className="mt-1 block text-steel/60">
            search: “{searchHint}”
          </span>
        </figcaption>
      </div>
      {/* corner ticks so the slot reads as an intentional frame */}
      <span aria-hidden className="absolute left-1 top-1 h-2 w-2 border-l border-t border-steel/50" />
      <span aria-hidden className="absolute right-1 top-1 h-2 w-2 border-r border-t border-steel/50" />
      <span aria-hidden className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-steel/50" />
      <span aria-hidden className="absolute bottom-1 right-1 h-2 w-2 border-b border-r border-steel/50" />
    </figure>
  );
}
