# Belalak — Design & Animation Plan

Single-page, scroll-driven B2B site: the production journey of Belarusian milk
powder, from milking parlor to spray drier, with two interactive decision
points that change the downstream visuals and the final product.

## Stack decision

**Next.js 15 (App Router) + TypeScript**, kept from the repo's existing
scaffold. Justification: the metadata/SEO plumbing, the `/api/contact` route
(so the RFQ form has a real endpoint that can later forward to a CRM), and
static asset serving are already wired; a Vite rewrite would buy nothing.
Everything animated is a `"use client"` component; the page shell stays
server-rendered for SEO.

- **GSAP + ScrollTrigger** — one pinned, scrubbed timeline per stage,
  registered in a central `lib/timelines.ts` registry.
- **Lenis** smooth scrolling feeding `ScrollTrigger.update()` (kept from the
  scaffold — scrubbed timelines feel dramatically better with it). Disabled
  for `prefers-reduced-motion`.
- **Zustand** — `useJourneyState` holds the two branch choices.
- **Framer Motion** — micro-interactions only (choice cards, buttons, chips).
- **Canvas 2D** — spray-drying atomization only. No WebGL.

## Design tokens

Defined as CSS variables in `globals.css`, referenced by Tailwind config —
no raw hex anywhere in components.

| Token             | Value     | Role                                          |
| ----------------- | --------- | --------------------------------------------- |
| `--c-milk`        | `#FDFCF7` | Milk white — primary background               |
| `--c-ivory`       | `#F3EDDF` | Warm ivory — alternating sections, cards      |
| `--c-steel`       | `#42536B` | Steel blue-grey — equipment, secondary text   |
| `--c-steel-deep`  | `#16202B` | Deep steel — dark stages (drying), ink/text   |
| `--c-cream`       | `#D9A63F` | Butter gold — cream stream, accents, CTAs     |
| `--c-pasture`     | `#2E5B40` | Pasture green — Belarus notes, PASS stamps    |

Typography (Google Fonts via `next/font`, self-hosted at build):

- **Display — Archivo** (700/800, tight tracking): industrial grotesque for
  stage titles and numbers.
- **Body — IBM Plex Sans** (400/500/600): engineered, highly readable.
- **Data — IBM Plex Mono** (400/500): every instrument readout, spec table,
  and lab value renders in mono so data *looks like data*.

Stages are numbered `01–09` in mono; the numbering is honest — the process is
a sequence.

## The connecting stream (signature element)

A `StreamConnector` component sits between every pair of stages: a short
(~55vh) section with a centered vertical pipe. A scrubbed timeline wipes the
milk column downward as you scroll through it. The stream *changes state*
along the page via a `variant` prop plus live store reads:

raw → chilled (4 °C tag) → tested → pasteurized → **skim | whole**
(whole = gold fat droplets suspended in the flow) → concentrate (narrower,
denser column) → powder (falling particle dashes instead of liquid).

## Stage choreography (one paragraph each)

1. **Farm** — pinned 260vh. Scrub: parlor scene fades up with parallax
   (sky/field behind, stalls mid, pipework front); milking cups pulse
   (time-based ambient loop, not scrub); milk lines fill via
   `stroke-dashoffset`; the chilled tank level rises; thermometer counts
   36 → 4 °C. Steam wisps and grass sway are ambient loops, killed under
   reduced motion.
2. **Transport** — pinned 260vh. Scrub: tanker truck translates along the
   road path while hills parallax the opposite way; wheels rotate
   (`rotation` proportional to x); a mono gauge holds "4.0 °C" with ±0.1
   jitter; km counter counts up.
3. **Quality testing** — pinned 420vh (the longest — thoroughness *is* the
   message). Ten lab readouts appear sequentially, each: instrument value
   counts to target, then a green `PASS` stamp scales in (1.4 → 1.0 with
   opacity). After the tenth pass, the reception valve rotates 90° and the
   stream draws onward. Copy states failing milk is rejected.
4. **Pasteurization** — pinned 300vh. Scrub: milk path threads the plate
   pack; gradient shifts cool → warm as temp counts 4 → 72.5 °C; a hold
   timer runs 0 → 15 s across the holding tube; regeneration section cools
   the gradient back; outlet temp returns to 4 °C.
5. **Decision 1 — separation** — pinned; scrub brings the centrifugal
   separator in, then the timeline *rests* while two choice cards wait.
   Choosing **skim** plays (not scrubbed): bowl spins up, gold cream stream
   arcs to a "Cream — for butter & cream products" tank, white skim
   continues down. Choosing **whole** highlights the bypass line and seeds
   gold fat droplets into the main stream. Store updates; `aria-live`
   announces; scrolling past without choosing applies the default (whole)
   and says so.
6. **Evaporation** — pinned 300vh. Falling-film evaporator (two effects +
   vapor separator): feed film dashes descend the tubes, steam particles
   rise into the vapor duct, the outgoing stream visibly narrows/thickens,
   total-solids counter climbs 12.5 → 48 %.
7. **Decision 2 — instantizing** — same interaction pattern as stage 5.
   **Instant**: lecithin doser drips gold, fine particles agglomerate into
   porous clusters; side beaker demo dissolves a spoonful instantly.
   **Regular**: straight-through line, fine even particles; beaker demo
   disperses slowly with brief clumps. Default on scroll-past: regular.
8. **Spray drying (finale)** — pinned 480vh, dark steel background. Cutaway
   tower in SVG; a Canvas 2D particle system inside the tower atomizes
   droplets at the nozzle, hot-air gradient flows down, particles shrink +
   solidify mid-fall (white translucent → matte powder), heap grows at the
   cone, fines spiral through the cyclone. Readouts: inlet 185 °C, outlet
   88 °C, moisture 45 → 3.5 %. Particle count adapts to viewport/mobile;
   the rAF loop only runs while the section is active.
9. **Final product** — resolves the two choices into one of four products
   (SMP/WMP × regular/instant): 25 kg kraft bag SVG with Belalak branding
   and variant-colored band, mono spec table, applications, RFQ CTA.
   "Change my choices" jumps back to either decision stage.

A floating **line-setup chip** (bottom left, appears after decision 1) shows
current choices with change buttons at all times.

## Branching state flow

`useJourneyState` (Zustand): `{ fat: 'skim'|'whole'|null, texture:
'instant'|'regular'|null, fatDefaulted, textureDefaulted }` + setters.
Decision stages write it; `StreamConnector`, stage 6/8 visuals, stage 9, and
the products grid read it. `productKey` selector derives one of
`smp-regular | smp-instant | wmp-regular | wmp-instant` (null until known,
UI falls back to defaults for preview). Choices are announced through a
shared `aria-live="polite"` region.

## Reduced motion & mobile

All markup is authored in its **final state**; timelines run inside
`gsap.matchMedia('(prefers-reduced-motion: no-preference)')` and set initial
states via `fromTo`. Under reduced motion: no pinning, no scrub, no canvas
loop (one static frame), sections simply exist and fade via CSS-safe
opacity. Mobile (<768 px): shorter pin distances, ~40 % particle counts,
same narrative.

## Assumptions made (per brief: choose and state)

- Defaults when a visitor scrolls past a decision without choosing: whole +
  regular (the most common commodity spec), always changeable via the chip.
- Contact email placeholder `export@belalak.com` — `<!-- OWNER -->` marked.
- Spec values are typical industry ranges, labeled "typical specification";
  anything owner-specific is marked `OWNER: verify`.
