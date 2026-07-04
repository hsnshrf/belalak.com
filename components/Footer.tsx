import { STAGES } from "@/lib/stages";

export default function Footer() {
  return (
    <footer className="border-t border-milk/15 bg-steel-deep py-14 text-milk">
      <div className="container-site grid gap-10 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-tight">BELALAK</p>
          <p className="readout mt-2 !text-milk/60">
            BELARUSIAN MILK POWDER · FARM TO SPRAY DRIER
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-milk/70">
            Skim and whole milk powder, regular or instantized, for food
            manufacturers worldwide.
          </p>
        </div>

        <nav aria-label="Production stages" className="font-mono text-xs">
          <p className="readout mb-3 !text-milk/60">THE LINE</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {STAGES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-milk/70 hover:text-milk">
                  {s.num} {s.short}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="font-mono text-xs">
          <p className="readout mb-3 !text-milk/60">CONTACT</p>
          {/* OWNER: replace with your real sales inbox + company details */}
          <a href="mailto:export@belalak.com" className="text-milk/80 underline decoration-cream underline-offset-2 hover:text-milk">
            export@belalak.com
          </a>
          <p className="mt-4 text-milk/50">
            © {new Date().getFullYear()} Belalak. Product of Belarus.
          </p>
        </div>
      </div>
    </footer>
  );
}
