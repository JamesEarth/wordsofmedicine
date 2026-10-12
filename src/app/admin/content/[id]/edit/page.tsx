import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminContent } from "@/lib/db";
import CreateArticleForm from "@/components/admin/create-article-form";

type Props = { params: Promise<{ id: string }> };

export default function EditArticlePage({ params }: Props) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Suspense fallback={<p>Loading article…</p>}><Editor params={params} /></Suspense>
    </main>
  );
}

async function Editor({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const article = await getAdminContent(id);
  if (!article) notFound();
  return <><h1 className="text-2xl font-bold">Edit article</h1><CreateArticleForm article={article} /></>;
}
