"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Plus, Search, X } from "lucide-react";
import { useState } from "react";

export function Brand({ name = "Words of Medicine" }: { name?: string }) {
  return <Link href="/" className="brand" aria-label={`${name} home`}><span className="brand-symbol"><Plus strokeWidth={1.6} /></span><span>{name}<small>HEALTH, IN SIMPLE WORDS.</small></span></Link>;
}

export function SiteHeader({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = [
    { label: "Home", href: "/" },
    { label: "Medicines", href: "/library?category=medicines" },
    { label: "Conditions", href: "/library?category=conditions" },
    { label: "Instruments", href: "/library?category=instruments" },
    { label: "Health & wellness", href: "/library?category=wellness" },
  ];
  return <header className="site-header"><div className="container header-inner">
    <Brand name={siteName} />
    <nav id="main-navigation" className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
      {links.map((link) => <Link key={link.label} href={link.href} className={pathname === "/" && link.href === "/" ? "active" : ""} onClick={() => setOpen(false)}>{link.label}</Link>)}
      <Link href="/about" className="mobile-about" onClick={() => setOpen(false)}>About us</Link>
    </nav>
    <div className="header-actions"><Link className="icon-button" href="/library" aria-label="Search the medical library"><Search size={19} /></Link><Link className="header-about" href="/about">About us <ArrowUpRight size={15} /></Link><button type="button" className="icon-button menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="main-navigation" aria-label={open ? "Close navigation" : "Open navigation"}>{open ? <X /> : <Menu />}</button></div>
  </div></header>;
}
