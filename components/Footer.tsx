import Image from "next/image";
import logo from "@/public/logo.png";
import { products } from "@/lib/products";

const COMPANY_LINKS = [
  { href: "#process", label: "Our Process" },
  { href: "#belarus", label: "Why Belarus" },
  { href: "#quality", label: "Quality & Certifications" },
  { href: "#sustainability", label: "Sustainability" },
  { href: "#about", label: "About Us" },
];

export default function Footer() {
  return (
    <footer className="bg-deep-950 pb-10 pt-20 text-deep-100/70">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* brand */}
          <div>
            <a href="#top" aria-label="Belalak Milk — back to top" className="inline-block">
              <span className="inline-flex items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
                <Image src={logo} alt="Belalak Milk" className="h-14 w-auto" />
              </span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              Premium milk powder supplier sourcing and manufacturing in the Republic of
              Belarus. Skim milk powder, whole milk powder, instant fat filled milk powder
              and whey powder — exported worldwide, distributed from the UAE.
            </p>
            <p className="mt-5 text-xs uppercase tracking-kicker text-gold/80">
              Made in Belarus · Distributed from UAE
            </p>
          </div>

          {/* products */}
          <nav aria-label="Products">
            <p className="kicker text-milk/60">Products</p>
            <ul className="mt-5 space-y-3 text-sm">
              {products.map((p) => (
                <li key={p.slug}>
                  <a href="#products" className="transition-colors hover:text-milk">
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* company */}
          <nav aria-label="Company">
            <p className="kicker text-milk/60">Company</p>
            <ul className="mt-5 space-y-3 text-sm">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors hover:text-milk">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* contact */}
          <div>
            <p className="kicker text-milk/60">Contact</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href="mailto:export@belalak.com" className="transition-colors hover:text-milk">
                  export@belalak.com
                </a>
              </li>
              <li>Production · Minsk, Belarus</li>
              <li>Distribution · Dubai, UAE</li>
              <li>
                <a href="#contact" className="text-gold-light transition-colors hover:text-gold">
                  Send an export inquiry →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-deep-800 pt-8 text-xs leading-relaxed text-deep-100/40">
          <p>
            Belalak Milk — Belarus milk powder supplier for dairy ingredients in the UAE,
            MENA, Asia, Africa and Latin America. Skim Milk Powder · Whole Milk Powder ·
            Instant Fat Filled Milk Powder · Whey Powder.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} Belalak Milk. All rights reserved. belalak.com</p>
        </div>
      </div>
    </footer>
  );
}
