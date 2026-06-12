import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const ORIGIN = { x: 545, y: 130, name: "Minsk" };

const ROUTES = [
  { x: 640, y: 265, name: "Dubai", dur: "4s", begin: "0s" },
  { x: 565, y: 250, name: "Cairo", dur: "3.4s", begin: "0.6s" },
  { x: 478, y: 340, name: "Lagos", dur: "4.6s", begin: "1.2s" },
  { x: 706, y: 300, name: "Mumbai", dur: "4.2s", begin: "0.3s" },
  { x: 812, y: 368, name: "Jakarta", dur: "5s", begin: "1.8s" },
  { x: 846, y: 226, name: "Shanghai", dur: "4.4s", begin: "0.9s" },
  { x: 300, y: 396, name: "São Paulo", dur: "5.4s", begin: "1.5s" },
];

/** Quadratic arc from Minsk to a destination, lifted for a great-circle feel. */
function arcPath(to: { x: number; y: number }) {
  const mx = (ORIGIN.x + to.x) / 2;
  const my = Math.min(ORIGIN.y, to.y) - Math.abs(to.x - ORIGIN.x) * 0.18 - 40;
  return `M${ORIGIN.x} ${ORIGIN.y} Q${mx} ${my} ${to.x} ${to.y}`;
}

/**
 * Global export — an abstract night-mode trade map. Animated routes
 * radiate from Belarus; travelling beads ride each arc via SMIL
 * animateMotion (zero-JS, works as a server component).
 */
export default function GlobalExport() {
  return (
    <section id="export" className="grain relative bg-deep-950 py-28 sm:py-36">
      <div className="container-site">
        <SectionHeading
          kicker="Global Export"
          title="From Belarus to the world"
          lede="Supplying premium dairy ingredients to customers around the world — with full export documentation and cold-chain-to-port logistics."
          tone="dark"
        />

        <Reveal>
          <div className="relative mt-16 overflow-hidden rounded-3xl border border-deep-700/50 bg-deep-900/40 p-4 sm:p-8">
            <svg viewBox="0 0 1000 520" className="w-full" role="img" aria-label="Export routes from Belarus to markets across the world">
              <defs>
                <pattern id="ge-dots" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.4" fill="#2D659F" opacity="0.45" />
                </pattern>
                <radialGradient id="ge-origin" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#C9A96A" stopOpacity="0.5" />
                  <stop offset="1" stopColor="#C9A96A" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* abstract dotted globe-grid */}
              <rect width="1000" height="520" fill="url(#ge-dots)" />
              {[80, 180, 280, 380, 480].map((y) => (
                <path key={y} d={`M0 ${y} Q500 ${y - 36} 1000 ${y}`} fill="none" stroke="#123A66" strokeWidth="1" opacity="0.6" />
              ))}
              {[160, 330, 500, 670, 840].map((x) => (
                <path key={x} d={`M${x} 0 Q${x + 26} 260 ${x} 520`} fill="none" stroke="#123A66" strokeWidth="1" opacity="0.6" />
              ))}

              {/* routes */}
              {ROUTES.map((route) => (
                <g key={route.name}>
                  <path className="route-draw" d={arcPath(route)} fill="none" stroke="#C9A96A" strokeWidth="1.6" opacity="0.55" />
                  {/* travelling shipment bead */}
                  <circle r="4" fill="#FFF7E8">
                    <animateMotion dur={route.dur} begin={route.begin} repeatCount="indefinite" path={arcPath(route)} />
                  </circle>
                  {/* destination */}
                  <circle cx={route.x} cy={route.y} r="10" fill="#C9A96A" opacity="0.2" className="animate-ping-soft" style={{ transformOrigin: `${route.x}px ${route.y}px` }} />
                  <circle cx={route.x} cy={route.y} r="4.5" fill="#C9A96A" />
                  <text x={route.x} y={route.y + 24} textAnchor="middle" fontSize="14" fill="#AFC9E5">
                    {route.name}
                  </text>
                </g>
              ))}

              {/* origin: Belarus */}
              <circle cx={ORIGIN.x} cy={ORIGIN.y} r="56" fill="url(#ge-origin)" />
              <circle cx={ORIGIN.x} cy={ORIGIN.y} r="22" fill="#C9A96A" opacity="0.25" className="animate-ping-soft" style={{ transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px` }} />
              <circle cx={ORIGIN.x} cy={ORIGIN.y} r="8" fill="#FFF7E8" stroke="#C9A96A" strokeWidth="3" />
              <text x={ORIGIN.x} y={ORIGIN.y - 22} textAnchor="middle" fontSize="16" fontWeight="600" letterSpacing="2" fill="#FFF7E8">
                BELARUS
              </text>
            </svg>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 text-center sm:grid-cols-3">
          {[
            { big: "30+", small: "Active export markets across MENA, Asia, Africa & LATAM" },
            { big: "FCL / LCL", small: "Container, palletised and break-bulk shipment options" },
            { big: "48 h", small: "Documentation turnaround on confirmed orders" },
          ].map((item, i) => (
            <Reveal key={item.big} delay={i * 0.08}>
              <div className="rounded-2xl border border-deep-700/50 bg-deep-900/50 p-7">
                <p className="font-serif text-4xl text-gold-light">{item.big}</p>
                <p className="mt-2 text-sm text-deep-100/60">{item.small}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
