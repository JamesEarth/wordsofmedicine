import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import CreateArticleForm from "@/components/admin/create-article-form";

export default function NewArticlePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Suspense fallback={<p>Checking your session…</p>}>
        <ProtectedArticleForm />
      </Suspense>
    </main>
  );
}

async function ProtectedArticleForm() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold">Create article</h1>
      <CreateArticleForm />
    </div>
  );
}
