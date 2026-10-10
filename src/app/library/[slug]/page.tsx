import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Clock3, HeartHandshake } from "lucide-react";
import { ArticleCard, PublicShell } from "@/components/public-ui";
import { categories, getCategory } from "@/lib/categories";
import { getPublishedContent, getSettings, listPublishedContent } from "@/lib/db";

const getArticle = cache(getPublishedContent);
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Guide not found", robots: { index: false } };
  return { title: article.title, description: article.summary, openGraph: { title: article.title, description: article.summary, type: "article" } };
}

function ArticleBody({ body }: { body: string }) {
  return body.split(/\n\s*\n/).filter(Boolean).map((block, index) => {
    const lines = block.trim().split("\n");
    if (lines.length === 1 && lines[0].startsWith("## ")) return <h2 key={index}>{lines[0].slice(3)}</h2>;
    if (lines.every((line) => line.startsWith("- "))) return <ul key={index}>{lines.map((line, item) => <li key={item}>{line.slice(2)}</li>)}</ul>;
    return <p key={index}>{lines.map((line, item) => <span key={item}>{item > 0 && <br />}{line}</span>)}</p>;
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([getArticle(slug), getSettings()]);
  if (!article) notFound();
  const category = getCategory(article.category);
  const allArticles = await listPublishedContent();
  const related = allArticles.filter((item) => item.id !== article.id).sort((first, second) => Number(second.category === article.category) - Number(first.category === article.category)).slice(0, 3);

  return <PublicShell settings={settings}><main id="main-content" className="article-page container">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/library">Health library</Link><span>/</span><Link href={`/library?category=${article.category}`}>{category?.shortName || "Guide"}</Link></nav>
    <div className="article-layout"><article className="article-detail">
      <Link href={`/library?category=${article.category}`} className={`category-label ${category?.color || "sage"}`}>{category?.shortName || "Health guide"}</Link>
      <h1>{article.title}</h1><p className="article-intro">{article.summary}</p>
      <div className="detail-meta"><span><Clock3 size={15} />{article.readTime} min read</span><span>Updated {new Date(article.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}</span>{article.tag && <span>{article.tag}</span>}</div>
      {article.imageUrl && <div className="detail-image"><Image src={article.imageUrl} alt="" fill sizes="(max-width: 1000px) 100vw, 750px" unoptimized /></div>}
      <div className="article-body"><ArticleBody body={article.body} /></div>
      {article.sourceName && article.sourceUrl && <section className="source-box"><BookOpen size={22} strokeWidth={1.5} /><div><h2>Keep learning from the source</h2><p>This introduction draws on publicly available information. Read the original resource for more detail.</p><a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">{article.sourceName}<ArrowUpRight size={16} /></a></div></section>}
      <aside className="learning-note"><HeartHandshake size={22} strokeWidth={1.5} /><div><h3>A note on your health</h3><p>{settings.disclaimer}</p></div></aside>
      <Link href={`/library?category=${article.category}`} className="back-link"><ArrowLeft size={16} />Back to {category?.shortName.toLowerCase() || "the library"}</Link>
    </article><aside className="article-sidebar"><div className="sidebar-browse"><span className="overline">KEEP YOUR CURIOSITY HEALTHY</span><h2>There’s more to explore.</h2><p>A helpful guide for every question.</p><nav aria-label="Explore more health topics">{categories.map((item) => <Link key={item.id} href={`/library?category=${item.id}`}>{item.name}<ArrowRight size={16} /></Link>)}</nav></div><div className="learning-note"><BookOpen size={25} strokeWidth={1.5} /><h3>Knowledge with context.</h3><p>Learn about our approach to sources, education, and keeping information clear.</p><Link href="/about#editorial" className="text-link">Our editorial approach<ArrowUpRight size={15} /></Link></div></aside></div>
    {related.length > 0 && <section className="related-section"><div className="section-heading"><div><span className="overline">A LITTLE MORE TO KNOW</span><h2>Continue exploring</h2></div><Link href="/library" className="text-link">View all guides<ArrowRight size={17} /></Link></div><div className="articles-grid">{related.map((item) => <ArticleCard key={item.id} article={item} />)}</div></section>}
  </main></PublicShell>;
}
