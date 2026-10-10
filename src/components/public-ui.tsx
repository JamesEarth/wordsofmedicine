import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, BookOpen, Clock3, Heart, Search } from "lucide-react";
import { Brand, SiteHeader } from "@/components/site-header";
import { categories, getCategory } from "@/lib/categories";
import type { Content, SiteSettings } from "@/lib/db";

export function SearchForm({ value = "", compact = false }: { value?: string; compact?: boolean }) {
  return <form action="/library" className={`search-form ${compact ? "compact-search" : ""}`} role="search"><Search aria-hidden="true" size={21} /><label className="sr-only" htmlFor={compact ? "library-search" : "home-search"}>Search medicines, conditions, and more</label><input id={compact ? "library-search" : "home-search"} type="search" name="q" defaultValue={value} placeholder="Search medicines, conditions, and more..." maxLength={200} /><button type="submit" aria-label="Search library"><span>Search</span><ArrowRight size={19} /></button></form>;
}

export function ArticleCard({ article }: { article: Content }) {
  const category = getCategory(article.category);
  const Icon = category.icon;
  return <article className="article-card"><Link href={`/library/${article.slug}`} className={`article-image ${category.color}`} aria-label={`Read ${article.title}`}>
    {article.imageUrl ? <Image src={article.imageUrl} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" unoptimized /> : <Icon className="article-placeholder" size={64} strokeWidth={1} />}
    <span className="image-link"><ArrowUpRight size={20} /></span>
  </Link><div className="article-card-content"><div className="article-meta"><span className={`category-label ${category.color}`}>{article.tag || category.shortName}</span><span><Clock3 size={12} /> {article.readTime} min read</span></div><h3><Link href={`/library/${article.slug}`}>{article.title}</Link></h3><p>{article.summary}</p><Link className="read-link" href={`/library/${article.slug}`}>Read the guide <ArrowRight size={16} /></Link></div></article>;
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return <footer className="site-footer"><div className="container"><div className="footer-main"><div className="footer-brand"><Brand name={settings.siteName} /><p>{settings.footerText || "A little understanding can make a world of difference. Health information, made human."}</p><span className="footer-note"><Heart size={14} /> Made for the curious. Open to everyone.</span></div><div><h3>Explore the library</h3>{categories.slice(0, 3).map((category) => <Link key={category.id} href={`/library?category=${category.id}`}>{category.name}</Link>)}</div><div><h3>A healthier everyday</h3><Link href="/library?category=wellness">Health & wellness</Link><Link href="/library?category=first-aid">First aid essentials</Link><Link href="/library">Browse A–Z</Link></div><div><h3>Words of Medicine</h3><Link href="/about">About this project</Link><Link href="/about#editorial">Our editorial approach</Link><Link href="/admin">Admin sign in <ArrowUpRight size={12} /></Link></div></div><div className="medical-note"><BookOpen size={18} /><p>{settings.disclaimer || "For learning, not diagnosis. This website provides general educational information and is not a substitute for advice from a qualified healthcare professional. For a medical emergency, contact your local emergency services."}</p></div><div className="footer-bottom"><span>© 2026 {settings.siteName}. Knowledge is for everyone.</span><Link href="/privacy">Privacy policy</Link></div></div></footer>;
}

export function PublicShell({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  return <><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader siteName={settings.siteName} />{children}<SiteFooter settings={settings} /></>;
}
