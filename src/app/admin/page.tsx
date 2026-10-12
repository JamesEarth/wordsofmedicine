import { listAdminContent } from "@/lib/db";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/admin-actions";
import Link from "next/link";
import PublishArticleForm from "@/components/admin/publish-article-form";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Suspense fallback={<p>Checking your session…</p>}>
        <AdminDashboard />
      </Suspense>
    </main>
  );
}

async function AdminDashboard() {
  const admin = await requireAdmin();
  const articles = await listAdminContent();

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin dashboard</h1>

      <p className="mt-6">Signed in as {admin.email}</p>
      <Link
        href="/admin/content/new"
        className="mt-6 inline-block rounded-lg bg-teal-700 p-3 font-semibold text-white"
      >
        Create article
      </Link>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          Articles ({articles.length})
        </h2>

        {articles.length === 0 ? (
          <p className="mt-4 text-slate-600">No articles yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {articles.map((article) => (
              <li
                key={article.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <h3 className="font-semibold">{article.title}</h3>

                <p className="mt-2 text-sm text-slate-600">
                  Category: {article.category}
                </p>

                <p className="text-sm text-slate-600">
                  Status: {article.status}
                </p>

                {article.status === "draft" && (
                  <PublishArticleForm articleId={article.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-lg bg-teal-700 p-3 font-semibold text-white"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
