# Belalak Milk — belalak.com

Premium brand website for **Belalak Milk**, a dairy ingredients brand sourcing and
manufacturing high-quality milk powders in the Republic of Belarus. The site is an
award-style interactive storytelling experience: a cinematic scroll journey that
visually transforms fresh Belarusian milk into premium milk powder.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 3 (custom brand palette & utilities) |
| Component animation | Framer Motion 12 |
| Scroll choreography | GSAP 3 + ScrollTrigger (scrub-driven pinned scenes) |
| Smooth scrolling | Lenis (integrated into GSAP's ticker) |
| Particle effects | Hand-rolled `<canvas>` system (spray-drying tower) |
| Fonts | Calibri site-wide, with self-hosted Carlito (metric-compatible open clone) as the web fallback via Fontsource |

Three.js/R3F was deliberately left out: every scene is achievable with SVG + canvas +
GSAP at a fraction of the bundle cost, which is what keeps Lighthouse comfortably
above 90. The hero and spray-drying tower are the natural upgrade points if you later
want real 3D.

## The Experience

1. **Cinematic hero** — a milk drop hangs in space; scrolling lets it fall while the
   camera pulls back to reveal a stainless collection tank. Impact → splash → ripples →
   the headline rises word by word.
2. **Signature scroll journey** — six pinned, scrub-animated stages:
   - *Collection* — tanker truck + parallax Belarusian countryside
   - *Quality testing* — lab equipment fades in, tubes fill, batch stamped PASSED
   - *Pasteurization* — self-drawing stainless lines, sweeping gauge, 72.5 °C counter
   - *Concentration* — falling liquid level, rising vapour, solids counter 12 → 48 %
   - *Spray drying* (centerpiece) — a live canvas particle system: **MILK → PARTICLES → POWDER**
   - *Final product* — powder particles converge into the finished Belalak bag
3. **Products** — 4 powders with CSS packaging mockups, hover sheen, spec modals and
   downloadable PDF spec sheets (`public/specs`, regenerable via `npm run generate:specs`).
4. **Why Belarus / Quality / Sustainability / Global Export / About / Contact** —
   animated map, stat counters, interactive 5-step quality timeline, certification
   badges, self-drawing illustrations, SMIL-animated export routes, glassmorphism
   inquiry form posting to `/api/contact`.

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Deployment

### Vercel (recommended)

1. Push this repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — Next.js is auto-detected,
   no configuration needed.
3. Add the `belalak.com` domain in *Project → Settings → Domains* and point the
   domain's DNS (`A` → `76.76.21.21` or `CNAME` → `cname.vercel-dns.com`).

### Any Node host

```bash
npm ci && npm run build
npm start            # serves on $PORT (default 3000) behind your reverse proxy
```

## Going Live Checklist

- **Contact form**: `app/api/contact/route.ts` validates and logs inquiries. Wire it
  to Resend/SendGrid/SES or your CRM where marked.
- **WhatsApp**: replace the placeholder number in `components/Contact.tsx`
  (`wa.me/971500000000`).
- **Certifications**: badge artwork in `components/Quality.tsx` is placeholder —
  swap in licensed ISO/HACCP/Halal marks once certificates are in hand.
- **Imagery**: all visuals are code-drawn placeholders (SVG/canvas/gradients); drop in
  brand photography via `next/image` wherever richer texture is wanted.

## SEO

- Per-page metadata + Open Graph/Twitter cards (`app/layout.tsx`), OG image generated
  at the edge (`app/opengraph-image.tsx`)
- JSON-LD: `Organization` + `WebSite` (layout) and `Product` `ItemList` (home page)
- `app/sitemap.ts` → `/sitemap.xml`, `app/robots.ts` → `/robots.txt`
- Target keywords woven through copy: Belalak Milk, Milk Powder Supplier, Skim Milk
  Powder, Whole Milk Powder, Whey Powder, Instant Fat Filled Milk Powder, Belarus Milk
  Powder, Dairy Ingredients UAE, Milk Powder UAE

## Performance & Accessibility

- Calibri served from the visitor's system where available; small self-hosted Carlito fallback files otherwise. Zero image downloads, code-drawn graphics
- Canvas work pauses when its section leaves the viewport; DPR capped at 2
- `prefers-reduced-motion` honoured everywhere: Lenis disabled, scrub scenes collapse
  to static final frames, decorative animation suppressed in CSS
- Semantic landmarks, labelled SVG illustrations, focus-visible rings, keyboard-friendly
  modal (Escape to close), `aria-live` form feedback

## Project Structure

```
app/                  layout (SEO), page, robots, sitemap, OG image, contact API
components/
  Hero.tsx            cinematic milk-drop scene
  process/            the six-stage scroll journey
  Products.tsx        cards + spec modal + PDF downloads
  WhyBelarus.tsx      animated map + stat counters
  Quality.tsx         interactive timeline + certification badges
  Sustainability.tsx  self-drawing illustrated pillars
  GlobalExport.tsx    animated world trade map
  About.tsx           brand story
  Contact.tsx         glassmorphism inquiry form
  SmoothScroll.tsx    Lenis ⇄ GSAP bridge
  ui/                 Reveal, SectionHeading, Counter
lib/                  gsap setup, hooks, product data
scripts/              PDF spec-sheet generator
public/specs/         generated specification PDFs
```
