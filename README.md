# Belalak — Belarusian Milk Powder

Single-page, scroll-driven B2B site: the production journey of milk powder
told in nine pinned, scrub-animated stages — from a Belarusian milking
parlor to a sealed 25 kg bag — with two interactive decision points
(skim/whole, instant/regular) that change the downstream visuals and the
final product.

See **DESIGN.md** for the design plan: tokens, per-stage animation
choreography and how the branching state flows.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Stack

- **Next.js 15 (App Router) + TypeScript** — page shell is server-rendered
  for SEO; everything animated is a client component.
- **GSAP + ScrollTrigger** — one pinned, scrubbed timeline per stage.
  Shared pin/scrub system: `lib/stageAnimation.ts` (`useStagePin`), which
  also handles reduced motion and the mobile no-pin fallback. All stage
  timelines are registered in a dev-inspectable registry
  (`window.__belalakTimelines`).
- **Lenis** smooth scrolling feeding `ScrollTrigger.update()`.
- **Zustand** — `lib/journeyState.ts` holds the two branch choices.
- **Framer Motion** — micro-interactions only (cards, chips, reveals),
  wrapped in `MotionConfig reducedMotion="user"`.
- **Canvas 2D** — `lib/sprayEngine.ts`, the spray-drying particle system
  (throttled, viewport-gated, ~40 % particle budget on mobile).
- **Tailwind CSS** — every color resolves to the CSS-variable tokens in
  `app/globals.css`; no raw hex in components.

## Structure

```
app/            layout (fonts, metadata), page, /api/contact endpoint
components/
  journey/      Stage01Farm … Stage09Product, StreamConnector,
                ChoiceCards, LineSetupChip, Announcer, Journey
  Header.tsx    sticky header + pipeline progress indicator
  Hero, WhyBelarus, ProductsGrid, Contact, Footer, PhotoSlot, Reveal
lib/            gsap setup, stage pin system, journey store, spray engine,
                stage metadata, product variant data
scripts/        generate-specs.mjs → /public/specs PDFs
```

## Accessibility & motion

- `prefers-reduced-motion`: no pinning, no scrub, no canvas loop (one
  static frame). All markup is authored in its final state, so every stage
  is fully legible without motion.
- Both decision points are plain buttons (`aria-pressed`), keyboard
  operable with visible focus; selections and applied defaults are
  announced via a polite live region (`Announcer.tsx`).
- Scrolling past a decision applies a default (whole / regular); the
  floating "line setup" chip and stage 09 let visitors change it anytime.

## OWNER: what to customize before going live

1. **Photography** — every `PhotoSlot` marks a slot with alt text and
   stock-search terms (farm stage, Why Belarus). Replace with licensed
   photos via `next/image` (instructions inside `components/PhotoSlot.tsx`).
2. **Verified claims** — search the codebase for `OWNER:` comments:
   spec values in `lib/variants.ts` (match your plant COA), the raw-milk
   intake limits in `Stage03Testing.tsx`, and the Why-Belarus claims.
   List certifications (ISO, HALAL, …) only if currently held.
3. **Contact email** — `export@belalak.com` appears in `Contact.tsx`,
   `Footer.tsx` and `app/layout.tsx` structured data.
4. **RFQ backend** — `app/api/contact/route.ts` validates and logs; wire
   your CRM or email provider (Resend/SendGrid/SES) there.
5. **Brand colors/typography** — edit the token block at the top of
   `app/globals.css` (and the mirrored hex values in
   `app/opengraph-image.tsx`); fonts load in `app/layout.tsx`.
6. **Spec sheet PDFs** — regenerate with `npm run generate:specs` after
   updating values in `scripts/generate-specs.mjs`.
