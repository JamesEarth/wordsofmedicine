import { Suspense } from "react";
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
          <details
            key={article.id}
            className="rounded-lg border border-slate-200 p-6"
          >
            <summary className="cursor-pointer text-xl font-semibold">
              {article.title}
            </summary>

            <p className="mt-4 text-slate-600">
              {article.summary}
            </p>

            <p className="mt-4 whitespace-pre-wrap">
              {article.body}
            </p>

            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                className="mt-4 inline-block text-teal-700 underline"
              >
                Source: {article.sourceName}
              </a>
            )}
          </details>
        ))}
      </div>
    </>
  );
}
