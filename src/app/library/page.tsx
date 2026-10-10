import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, ArrowRight, BookOpen, SearchX } from "lucide-react";
import { ArticleCard, PublicShell, SearchForm } from "@/components/public-ui";
import { categories } from "@/lib/categories";
import { getSettings, listPublishedContent } from "@/lib/db";

export const metadata: Metadata = {
  title: "Health library",
  description: "Explore clear introductions to medicines, health conditions, medical instruments, wellness, and first aid.",
};

type SearchParams = { q?: string | string[]; category?: string | string[]; letter?: string | string[] };

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const [settings, allArticles, params] = await Promise.all([getSettings(), listPublishedContent(), searchParams]);
  const query = single(params.q).trim().slice(0, 200);
  const category = categories.find((item) => item.id === single(params.category));
  const selectedLetter = /^[A-Z]$/.test(single(params.letter).toUpperCase()) ? single(params.letter).toUpperCase() : "";
  const articles = allArticles.filter((article) => {
    const matchesCategory = !category || article.category === category.id;
    const matchesLetter = !selectedLetter || article.title.toUpperCase().startsWith(selectedLetter);
    const matchesQuery = !query || `${article.title} ${article.summary} ${article.tag} ${article.body}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesLetter && matchesQuery;
  }).sort((first, second) => first.title.localeCompare(second.title));

  function filterLink(update: { category?: string; letter?: string }) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    const nextCategory = update.category ?? category?.id;
    const nextLetter = update.letter ?? selectedLetter;
    if (nextCategory) next.set("category", nextCategory);
    if (nextLetter) next.set("letter", nextLetter);
    return `/library${next.size ? `?${next.toString()}` : ""}`;
  }

  return <PublicShell settings={settings}><main id="main-content">
    <section className="library-hero"><div className="container"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Health library</span></nav><span className="overline">A LITTLE KNOWLEDGE GOES A LONG WAY</span><h1>{category ? category.name : "Your health. A little clearer."}</h1><p>{category ? category.description : "Understand the everyday, explore the unfamiliar, and find a helpful place to start."}</p><SearchForm value={query} compact /></div></section>
    <section className="library-content container">
      <nav className="library-filters" aria-label="Browse by category"><Link href={filterLink({ category: "" })} className={!category ? "selected" : ""} aria-current={!category ? "page" : undefined}><BookOpen size={16} />All topics</Link>{categories.map((item) => <Link key={item.id} href={filterLink({ category: item.id })} className={category?.id === item.id ? "selected" : ""} aria-current={category?.id === item.id ? "page" : undefined}>{item.shortName}</Link>)}</nav>
      <nav className="letter-filter" aria-label="Browse topics alphabetically"><Link href={filterLink({ letter: "" })} className={!selectedLetter ? "selected" : ""} aria-current={!selectedLetter ? "page" : undefined}>All</Link>{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => <Link key={letter} href={filterLink({ letter })} className={selectedLetter === letter ? "selected" : ""} aria-current={selectedLetter === letter ? "page" : undefined} aria-label={`Topics starting with ${letter}`}>{letter}</Link>)}</nav>
      <div className="results-heading"><h2>{query ? `Results for “${query}”` : selectedLetter ? `Topics beginning with ${selectedLetter}` : category ? `Explore ${category.shortName.toLowerCase()}` : "Explore the library"}</h2><span>{articles.length} {articles.length === 1 ? "guide" : "guides"}</span></div>
      {articles.length ? <div className="articles-grid library-grid">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div> : <div className="empty-state"><SearchX size={43} strokeWidth={1.4} /><h2>No guides found just yet.</h2><p>Try another search term, choose a different letter, or explore all topics.</p><Link href="/library" className="primary-button">Explore all guides<ArrowRight size={17} /></Link></div>}
      <Link href="/" className="back-link"><ArrowLeft size={16} />Back to the homepage</Link>
    </section>
  </main></PublicShell>;
}
