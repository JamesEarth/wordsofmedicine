import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, type Content } from "@/lib/db";
import { getUserSession } from "@/lib/user-auth";
import { getAdminSession } from "@/lib/auth";
import { addCommentAction, deleteCommentAction, setLikeAction } from "@/lib/member-actions";
import ActionForm from "@/components/action-form";
import ShareButton from "@/components/share-button";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };
type Member = NonNullable<Awaited<ReturnType<typeof getUserSession>>>;

export default function BlogPage(props: Props) {
  return <main className="mx-auto max-w-3xl px-6 py-16"><Suspense fallback={<p>Loading article…</p>}><Article {...props} /></Suspense></main>;
}

async function Article({ params, searchParams }: Props) {
  const { slug } = await params;
  const [user, admin] = await Promise.all([getUserSession(), getAdminSession()]);
  const article = await prisma.content.findFirst({
    where: { slug, status: "published", ...(!user && !admin ? { requiresLogin: false } : {}) },
  });

  if (!article) {
    const preview = await prisma.content.findFirst({ where: { slug, status: "published" }, select: { title: true, requiresLogin: true } });
    if (!user && !admin && preview?.requiresLogin) {
      return <section className="rounded-xl border border-teal-100 bg-teal-50 p-8"><p className="text-sm font-semibold text-teal-700">Members-only article</p><h1 className="mt-3 text-3xl font-bold">{preview.title}</h1><p className="my-6 text-slate-600">Sign in to read this article. New members can register with an invitation.</p><Link href={`/login?next=${encodeURIComponent(`/blog/${slug}`)}`} className="inline-block rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white">Sign in or register</Link></section>;
    }
    notFound();
  }

  const requestedPage = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100000) : 1;
  return (
    <article>
      <Link href="/#topics" className="text-sm text-teal-700 underline">All articles</Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-teal-700">{article.category} · {article.readTime} min read{article.requiresLogin ? " · Members only" : ""}</p>
      <h1 className="mt-3 text-3xl font-bold leading-tight">{article.title}</h1>
      <p className="mt-4 text-lg text-slate-600">{article.summary}</p>
      <div className="mt-8 whitespace-pre-wrap break-words leading-8">{article.body}</div>
      {article.sourceUrl && <a href={article.sourceUrl} className="mt-6 block text-teal-700 underline">Source: {article.sourceName}</a>}
      {admin && <Link href={`/admin/content/${article.id}/edit`} className="mt-4 inline-block text-sm text-teal-700 underline">Edit this article</Link>}
      {user || admin ? <MemberTools article={article} user={user} admin={Boolean(admin)} page={page} /> : <p className="mt-10 rounded-lg bg-slate-50 p-5"><Link href={`/login?next=${encodeURIComponent(`/blog/${slug}`)}`} className="font-semibold text-teal-700 underline">Sign in</Link> to see likes, comments, and sharing options.</p>}
    </article>
  );
}

async function MemberTools({ article, user, admin, page }: { article: Content; user: Member | null; admin: boolean; page: number }) {
  const [likeCount, ownLike, comments] = await Promise.all([
    prisma.like.count({ where: { contentId: article.id } }),
    user ? prisma.like.findUnique({ where: { userId_contentId: { userId: user.id, contentId: article.id } } }) : null,
    prisma.comment.findMany({ where: { contentId: article.id }, take: 21, skip: (page - 1) * 20, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, body: true, userId: true, user: { select: { username: true, displayName: true } } } }),
  ]);
  return (
    <section className="mt-12 border-t border-slate-200 pt-6" aria-label="Article interactions">
      <div className="flex flex-wrap items-center gap-4">
        {user ? <ActionForm action={setLikeAction} label={`${ownLike ? "Unlike" : "Like"} (${likeCount})`}><input type="hidden" name="contentId" value={article.id} /><input type="hidden" name="liked" value={ownLike ? "false" : "true"} /></ActionForm> : <p>{likeCount} likes</p>}
        <ShareButton title={article.title} />
      </div>
      <h2 className="mt-8 text-xl font-semibold">Comments</h2>
      {!article.commentsEnabled ? <p className="mt-3 text-slate-600">New comments are disabled for this article.</p> : !user ? <p className="mt-3 text-slate-600">Use a member account to write a comment.</p> : !user.canComment ? <p className="mt-3 text-slate-600">Commenting is disabled for your account.</p> : (
        <ActionForm action={addCommentAction} label="Post comment" resetOnSuccess><input type="hidden" name="contentId" value={article.id} /><label>Your comment<textarea name="body" rows={4} maxLength={2000} required /></label></ActionForm>
      )}
      {comments.length === 0 && <p className="mt-4 text-slate-500">{page === 1 ? "No comments yet." : "No more comments."}</p>}
      {comments.slice(0, 20).map((comment) => (
        <div key={comment.id} className="my-4 rounded-lg border border-slate-200 p-4">
          <p className="font-semibold">{comment.user.displayName ?? comment.user.username}</p><p className="mt-2 whitespace-pre-wrap break-words">{comment.body}</p>
          {(admin || comment.userId === user?.id) && <ActionForm action={deleteCommentAction} label={admin ? "Remove comment" : "Delete my comment"} danger confirmText="Delete this comment?"><input type="hidden" name="id" value={comment.id} /></ActionForm>}
        </div>
      ))}
      <nav aria-label="Comment pages" className="mt-6 flex gap-6 text-sm text-teal-700 underline">
        {page > 1 && <Link href={`/blog/${article.slug}?page=${page - 1}`}>Newer comments</Link>}
        {comments.length > 20 && <Link href={`/blog/${article.slug}?page=${page + 1}`}>Older comments</Link>}
      </nav>
    </section>
  );
}
