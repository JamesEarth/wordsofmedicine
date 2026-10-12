import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { listPublishedContent } from "@/lib/db";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">
          words of medicine
        </p>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Understand medicine, one word at a time.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-700">
          Explore medical concepts through clear explanations,
          practical insights, and a love of learning.
        </p>

        <a href="#topics" className="mt-8 inline-flex items-center justify-center rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
          Explore topics
        </a>

      </section>

      <section id="topics" className="mx-auto mt-12 max-w-4xl">
        <h2 className="text-2xl font-bold">Articles</h2>
        <Suspense fallback={<p className="mt-4">Loading articles…</p>}>
          <PublishedArticles />
        </Suspense>
      </section>
    </main>
  );
}

async function PublishedArticles() {
  await connection();
  const articles = await listPublishedContent();

  return (
    <>
      {articles.length === 0 && (
        <p className="mt-4 text-slate-600">
          No published articles yet.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {articles.map((article) => (
          <article
            key={article.id}
            className="rounded-lg border border-slate-200 p-6"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-700">{article.category} · {article.readTime} min read</p>
            <h3 className="text-xl font-semibold"><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3>

            <p className="mt-4 text-slate-600">
              {article.summary}
            </p>

            {article.requiresLogin && <p className="mt-3 text-sm font-medium text-slate-500">Members-only article</p>}
            <Link href={`/blog/${article.slug}`} className="mt-4 inline-block font-semibold text-teal-700 underline">Read article</Link>
          </article>
        ))}
      </div>
    </>
  );
}
