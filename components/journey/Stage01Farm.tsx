"use client";

import PhotoSlot from "@/components/PhotoSlot";
import { counterTween, drawTween, useStagePin } from "@/lib/stageAnimation";
import StageCopy from "./StageCopy";

/**
 * STAGE 01 — The dairy farm (milking).
 *
 * Choreography (scrubbed, ~2400px of scroll):
 *   0.0–0.6  landscape → parlor → tank fade/parallax in, copy rises
 *   0.6–1.6  milk lines draw claw → drop lines → main line (sequential)
 *   1.6–2.8  receiver jar + chilled tank fill, thermometer 36.6 → 4.0 °C
 *   2.8–3.4  chill badge stamps, outflow line draws toward the connector
 * Ambient (time-based, CSS): milking cups pulse, steam wisps, grass sway.
 */
export default function Stage01Farm() {
  const ref = useStagePin({
    id: "stage-farm",
    length: 2400,
    build: ({ tl, q }) => {
      tl.fromTo(q(".farm-layer-back"), { opacity: 0 }, { opacity: 1, duration: 0.5 })
        .fromTo(q(".farm-layer-mid"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, "<0.2")
        .fromTo(q(".farm-parlor"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5 }, "<0.2")
        .fromTo(q(".farm-tank-g"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.2")
        .fromTo(q(".stage-copy"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1);

      // Milk lines fill one cow at a time, then the main line to the tank.
      q(".farm-milk-line").forEach((line, i) => {
        tl.add(
          drawTween(line, { duration: i === 3 ? 0.9 : 0.35 }),
          i === 0 ? "+=0.1" : "-=0.1"
        );
      });
      tl.fromTo(q(".farm-milk-flow"), { opacity: 0 }, { opacity: 1, duration: 0.25 });

      // Receiver jar, then the chilled tank fills while the milk cools.
      tl.fromTo(
        q(".farm-jar-milk"),
        { attr: { height: 0, y: 448 } },
        { attr: { height: 24, y: 424 }, duration: 0.3 },
        "<"
      );
      tl.fromTo(
        q(".farm-tank-milk"),
        { attr: { height: 0, y: 460 } },
        { attr: { height: 76, y: 384 }, duration: 1.1 }
      );
      const temp = q(".farm-temp")[0];
      if (temp) {
        tl.add(
          counterTween(temp, { from: 36.6, to: 4.0, decimals: 1, suffix: " °C", duration: 1.1 }),
          "<"
        );
      }
      tl.fromTo(
        q(".farm-chill-badge"),
        { opacity: 0, scale: 0.7, transformOrigin: "center" },
        { opacity: 1, scale: 1, duration: 0.25 }
      );
      const out = q(".farm-out-line")[0];
      if (out) tl.add(drawTween(out, { duration: 0.5 }), "+=0.1");
    },
  });

  return (
    <section
      id="stage-farm"
      ref={ref as React.RefObject<HTMLElement>}
      aria-labelledby="stage-farm-title"
      className="relative overflow-hidden bg-milk"
    >
      <div className="container-site flex min-h-svh flex-col gap-4 pb-6 pt-[calc(var(--nav-height)+1.25rem)] md:grid md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-4">
          <StageCopy
            id="stage-farm"
            num="01"
            kicker="MILKING"
            title="The dairy farm"
          >
            <p>
              Powder quality is decided long before the drier. Belalak milk
              comes from healthy, monitored herds milked in automated parlors
              — closed stainless lines, no open buckets, no manual contact.
            </p>
            <p className="hidden sm:block">
              From the udder, milk flows straight to an insulated tank and is
              chilled to 4&nbsp;°C within minutes, stopping bacterial growth
              before it starts.
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {["chilled ≤ 4 °C", "hygienic automated milking", "healthy herds"].map((t) => (
                <li key={t} className="readout rounded border border-steel/25 px-2 py-1">
                  {t}
                </li>
              ))}
            </ul>
            <PhotoSlot
              className="mt-3 hidden h-24 md:block"
              alt="Modern milking parlor on a Belarusian dairy farm — Holstein cows in stalls with automated milking clusters"
              searchHint="modern dairy farm milking parlor Holstein automated"
            />
          </StageCopy>
        </div>

        <div className="min-h-0 flex-1 md:col-span-8">
          <svg
            viewBox="0 0 960 620"
            role="img"
            aria-label="Animated cross-section of a milking parlor: three cows with pulsating milking clusters, milk flowing through transparent lines into a chilled collection tank reading 4 degrees Celsius"
            className="mx-auto h-full max-h-[62vh] w-full md:max-h-[78vh]"
          >
            <defs>
              <linearGradient id="farm-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="stop-glass" />
                <stop offset="100%" className="stop-milk" />
              </linearGradient>
              <linearGradient id="farm-steel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="stop-steel-hi" />
                <stop offset="45%" className="stop-steel-mid" />
                <stop offset="100%" className="stop-steel-lo" />
              </linearGradient>
              <linearGradient id="farm-roof" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className="stop-steel-mid" />
                <stop offset="100%" className="stop-steel-lo" />
              </linearGradient>
              {/* one cow, reused three times */}
              <g id="farm-cow">
                {/* legs + hooves */}
                {[10, 24, 76, 90].map((x) => (
                  <g key={x}>
                    <rect x={x} y={-36} width={7} height={32} rx={2.5} fill="var(--m-milk-raw)" stroke="rgb(var(--c-steel))" strokeOpacity="0.25" />
                    <rect x={x} y={-8} width={7} height={5} rx={1.5} fill="rgb(var(--c-steel-deep))" />
                  </g>
                ))}
                {/* body */}
                <path
                  id="farm-cow-body"
                  d="M4,-46 C6,-66 30,-78 54,-78 C82,-78 102,-66 104,-48 C106,-36 100,-28 90,-27 L18,-27 C6,-29 2,-36 4,-46 Z"
                  fill="var(--m-milk-raw)"
                  stroke="rgb(var(--c-steel))"
                  strokeOpacity="0.3"
                />
                <clipPath id="farm-cow-clip">
                  <use href="#farm-cow-body" />
                </clipPath>
                {/* Holstein patches */}
                <g clipPath="url(#farm-cow-clip)" fill="rgb(var(--c-steel-deep))" opacity="0.82">
                  <path d="M30,-78 C46,-80 52,-64 44,-52 C36,-42 20,-46 18,-58 C16,-70 22,-76 30,-78 Z" />
                  <path d="M78,-70 C94,-72 106,-60 102,-46 C98,-34 80,-34 74,-46 C68,-58 70,-68 78,-70 Z" />
                  <path d="M50,-34 C58,-40 68,-36 66,-28 L48,-28 C44,-30 46,-32 50,-34 Z" />
                </g>
                {/* tail */}
                <path d="M104,-64 C112,-56 112,-38 108,-26" fill="none" stroke="rgb(var(--c-steel))" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
                {/* neck + head, lowered toward the feed rail */}
                <path d="M8,-64 C-2,-62 -12,-54 -16,-44 L-4,-36 C2,-44 8,-50 14,-52 Z" fill="var(--m-milk-raw)" stroke="rgb(var(--c-steel))" strokeOpacity="0.3" />
                <ellipse cx="-18" cy="-40" rx="13" ry="9" transform="rotate(-24 -18 -40)" fill="var(--m-milk-raw)" stroke="rgb(var(--c-steel))" strokeOpacity="0.35" />
                <ellipse cx="-25" cy="-33" rx="5.5" ry="4" transform="rotate(-24 -25 -33)" fill="var(--m-milk-warm)" />
                <circle cx="-16" cy="-43" r="1.4" fill="rgb(var(--c-steel-deep))" />
                <path d="M-12,-49 L-6,-55 L-2,-48 Z" fill="var(--m-milk-raw)" stroke="rgb(var(--c-steel))" strokeOpacity="0.35" />
                {/* udder */}
                <path d="M58,-28 C58,-14 82,-14 82,-28 L82,-27 L58,-27 Z" fill="var(--m-milk-warm)" stroke="rgb(var(--c-steel))" strokeOpacity="0.25" />
              </g>
              {/* milking cluster (kept out of the cow def so cups can pulse) */}
              <g id="farm-cluster">
                {[-9, -3, 3, 9].map((dx) => (
                  <rect key={dx} x={dx - 2.2} y={0} width={4.4} height={11} rx={2}
                    fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="0.8" />
                ))}
                <rect x={-6} y={11} width={12} height={7} rx={3} fill="var(--m-steel-lo)" />
              </g>
            </defs>

            {/* --- back layer: sky, sun, forest, birches --- */}
            <g className="farm-layer-back">
              <rect x="0" y="0" width="960" height="330" fill="url(#farm-sky)" />
              <circle cx="150" cy="110" r="38" fill="rgb(var(--c-cream))" opacity="0.4" />
              <path d="M0,240 Q160,208 340,232 T720,226 T960,238 L960,340 L0,340 Z" fill="rgb(var(--c-pasture))" opacity="0.22" />
              {/* birch trunks — a quiet nod to the Belarusian landscape */}
              {[70, 100, 210, 245].map((x, i) => (
                <g key={x} transform={`translate(${x} ${226 - (i % 2) * 8})`}>
                  <rect x="-2.5" y="0" width="5" height="66" rx="2" fill="var(--m-milk-raw)" stroke="rgb(var(--c-steel))" strokeOpacity="0.35" strokeWidth="0.6" />
                  {[10, 26, 44].map((y) => (
                    <rect key={y} x="-2.5" y={y} width="3.4" height="3" fill="rgb(var(--c-steel-deep))" opacity="0.55" />
                  ))}
                  <ellipse cx="0" cy="-10" rx="17" ry="15" fill="rgb(var(--c-pasture))" opacity="0.5" />
                </g>
              ))}
            </g>

            {/* --- mid layer: pasture fields --- */}
            <g className="farm-layer-mid">
              <path d="M0,300 Q240,282 480,296 T960,292 L960,620 L0,620 Z" fill="rgb(var(--c-pasture))" opacity="0.32" />
              <path d="M0,430 Q300,410 620,428 T960,424 L960,620 L0,620 Z" fill="rgb(var(--c-pasture))" opacity="0.45" />
            </g>

            {/* --- parlor: platform, roof, cows, clusters, milk lines --- */}
            <g className="farm-parlor">
              {/* roof + posts */}
              <path d="M300,208 L640,182 L700,208 L300,236 Z" fill="url(#farm-roof)" opacity="0.9" />
              {[318, 470, 622, 688].map((x) => (
                <rect key={x} x={x} y={214} width="6" height="146" fill="var(--m-steel-lo)" />
              ))}
              {/* raised platform */}
              <rect x="300" y="356" width="410" height="12" rx="2" fill="var(--m-steel-mid)" stroke="var(--m-steel-edge)" strokeWidth="1" />
              {[316, 420, 540, 660].map((x) => (
                <rect key={x} x={x} y={368} width="8" height="48" fill="var(--m-steel-lo)" />
              ))}
              {/* feed rail */}
              <rect x="288" y="330" width="10" height="26" rx="2" fill="var(--m-steel-lo)" />

              {/* cows */}
              <use href="#farm-cow" transform="translate(342 356)" />
              <use href="#farm-cow" transform="translate(482 356)" />
              <use href="#farm-cow" transform="translate(622 356)" />

              {/* pulsating clusters under each udder */}
              <g className="pulse-cup"><use href="#farm-cluster" transform="translate(412 332)" /></g>
              <g className="pulse-cup" style={{ animationDelay: "-0.35s" }}><use href="#farm-cluster" transform="translate(552 332)" /></g>
              <g className="pulse-cup" style={{ animationDelay: "-0.7s" }}><use href="#farm-cluster" transform="translate(692 332)" /></g>

              {/* steam wisps in the morning air */}
              {[
                { x: 322, d: "0s" },
                { x: 462, d: "-1.4s" },
                { x: 602, d: "-2.6s" },
              ].map((s) => (
                <path key={s.x} className="vapor" style={{ animationDelay: s.d }}
                  d={`M${s.x},300 C${s.x - 7},288 ${s.x + 7},278 ${s.x},264`}
                  fill="none" stroke="rgb(var(--c-milk))" strokeWidth="4" strokeLinecap="round" opacity="0" />
              ))}

              {/* transparent milk lines: glass tube + milk stroke + flow dashes */}
              <g fill="none" strokeLinecap="round">
                {/* glass tubes (always visible) */}
                <path d="M412,350 L412,432 L780,432" stroke="var(--m-glass)" strokeWidth="8" opacity="0.85" />
                <path d="M552,350 L552,432" stroke="var(--m-glass)" strokeWidth="8" opacity="0.85" />
                <path d="M692,350 L692,432" stroke="var(--m-glass)" strokeWidth="8" opacity="0.85" />
                {/* milk fill, drawn on scroll (order matters for the timeline) */}
                <path className="farm-milk-line" d="M412,350 L412,432" stroke="var(--m-milk-raw)" strokeWidth="4" />
                <path className="farm-milk-line" d="M552,350 L552,432" stroke="var(--m-milk-raw)" strokeWidth="4" />
                <path className="farm-milk-line" d="M692,350 L692,432" stroke="var(--m-milk-raw)" strokeWidth="4" />
                <path className="farm-milk-line" d="M412,432 L780,432" stroke="var(--m-milk-raw)" strokeWidth="4" />
                {/* flow dashes fade in once lines are full */}
                <g className="farm-milk-flow" opacity="1">
                  <path className="flow-dash" d="M412,350 L412,432 L780,432" stroke="rgb(var(--c-milk))" strokeWidth="2" />
                </g>
              </g>

              {/* receiver jar (milk meter) */}
              <g>
                <rect x="596" y="418" width="20" height="34" rx="4" fill="var(--m-glass)" opacity="0.8" stroke="var(--m-steel-lo)" strokeWidth="1" />
                <rect className="farm-jar-milk" x="598" y="424" width="16" height="24" rx="2" fill="var(--m-milk-raw)" />
              </g>
            </g>

            {/* --- chilled collection tank --- */}
            <g className="farm-tank-g">
              <rect x="798" y="466" width="10" height="30" fill="var(--m-steel-lo)" />
              <rect x="902" y="466" width="10" height="30" fill="var(--m-steel-lo)" />
              <rect x="780" y="380" width="150" height="84" rx="42" fill="url(#farm-steel)" stroke="var(--m-steel-edge)" strokeWidth="1.2" />
              <clipPath id="farm-tank-clip">
                <rect x="784" y="384" width="142" height="76" rx="38" />
              </clipPath>
              <g clipPath="url(#farm-tank-clip)">
                <rect className="farm-tank-milk" x="784" y="384" width="142" height="76" fill="var(--m-milk-cool)" />
              </g>
              {/* agitator motor */}
              <rect x="842" y="362" width="26" height="18" rx="3" fill="var(--m-steel-lo)" stroke="var(--m-steel-edge)" strokeWidth="1" />
              {/* temperature panel */}
              <rect x="796" y="336" width="86" height="26" rx="4" fill="rgb(var(--c-steel-deep))" />
              <text className="farm-temp" x="839" y="354" textAnchor="middle" fill="rgb(var(--c-milk))" fontFamily="var(--font-mono)" fontSize="14">
                4.0 °C
              </text>
              <g className="farm-chill-badge">
                <text x="893" y="354" textAnchor="middle" fontSize="13" fill="rgb(var(--c-pasture))">❄</text>
              </g>
              {/* outflow toward the next stage */}
              <path d="M905,464 L905,620" fill="none" stroke="var(--m-glass)" strokeWidth="8" opacity="0.85" />
              <path className="farm-out-line" d="M905,464 L905,620" fill="none" stroke="var(--m-milk-cool)" strokeWidth="4" />
            </g>

            {/* --- foreground grass --- */}
            <g>
              {[30, 90, 150, 240, 330, 700, 760, 850, 930].map((x, i) => (
                <g key={x} transform={`translate(${x} 610)`} className="sway" style={{ animationDelay: `${-(i * 0.42) % 3.6}s` }}>
                  <path d="M0,0 C-2,-10 -5,-14 -7,-22 M0,0 C0,-12 1,-16 0,-26 M0,0 C3,-10 5,-15 8,-20"
                    fill="none" stroke="rgb(var(--c-pasture))" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
                </g>
              ))}
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
