"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import logo from "@/public/logo.png";

const links = [
  { href: "#process", label: "The Journey" },
  { href: "#products", label: "Products" },
  { href: "#belarus", label: "Why Belarus" },
  { href: "#quality", label: "Quality" },
  { href: "#about", label: "About" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-luxe ${
        scrolled ? "glass-dark py-3 shadow-lg shadow-deep-950/20" : "bg-transparent py-5"
      }`}
    >
      <nav className="container-site flex items-center justify-between" aria-label="Main">
        <a href="#top" aria-label="Belalak Milk — home" className="shrink-0 transition-transform duration-300 ease-luxe hover:scale-[1.03]">
          <Image
            src={logo}
            alt="Belalak Milk"
            priority
            className="h-9 w-auto drop-shadow-[0_2px_8px_rgba(255,247,232,0.45)]"
          />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-milk/75 transition-colors hover:text-milk"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <a href="#contact" className="btn-light !px-6 !py-2.5 text-xs uppercase tracking-widest">
            Get a Quote
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`h-0.5 w-6 bg-milk transition-transform duration-300 ${
              open ? "translate-y-1 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 bg-milk transition-transform duration-300 ${
              open ? "-translate-y-1 -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-dark overflow-hidden lg:hidden"
          >
            <ul className="container-site flex flex-col gap-1 py-4">
              {[...links, { href: "#contact", label: "Contact" }].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-milk/85 transition-colors hover:bg-white/10 hover:text-milk"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
