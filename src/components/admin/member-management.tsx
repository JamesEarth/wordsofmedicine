import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteCommentAction, saveInviteAction, setCommentPermissionAction } from "@/lib/member-actions";
import ActionForm from "@/components/action-form";

export default async function MemberManagement() {
  await requireAdmin();
  const [users, invites, comments] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, username: true, email: true, canComment: true } }),
    prisma.invite.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, maxUses: true, usedCount: true, isActive: true } }),
    prisma.comment.findMany({ take: 50, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, body: true, user: { select: { username: true } }, content: { select: { title: true, slug: true, status: true } } } }),
  ]);

  return (
    <div className="mt-6 space-y-10">
      <div><h1 className="text-2xl font-bold">Members & invitations</h1><p className="mt-3 text-slate-600">Invite readers, manage comment permissions, and moderate discussions.</p></div>
      <section className="rounded-xl border border-slate-200 p-6" aria-labelledby="create-invites">
        <h2 id="create-invites" className="text-xl font-semibold">Create invitations</h2>
        <p className="mt-2 text-sm text-slate-600">For one shared code, choose 1 code and 100 registrations. For separate personal invitations, choose 100 codes and 1 registration each.</p>
        <ActionForm action={saveInviteAction} label="Generate invitations">
          <label>Number of codes<input name="count" type="number" min={1} max={100} defaultValue={1} required /></label>
          <label>Registrations allowed per code<input name="maxUses" type="number" min={1} max={10000} defaultValue={1} required /></label>
          <label>Custom code (optional, for one code only)<input name="code" minLength={16} maxLength={80} autoComplete="off" /><span className="font-normal text-slate-500">Leave blank to generate a random code.</span></label>
          <label><input name="isActive" type="checkbox" defaultChecked />Active</label>
        </ActionForm>
        <p className="text-sm text-slate-500">Copy generated codes from the success message. Codes cannot be retrieved later, but you can replace them below.</p>
      </section>
      <section aria-labelledby="existing-invites">
        <h2 id="existing-invites" className="text-xl font-semibold">Existing invitations ({invites.length})</h2>
        {invites.length === 0 && <p className="mt-3 text-slate-500">No invitations yet.</p>}
        {invites.map((invite) => (
          <details key={invite.id} className="my-3 rounded-lg border border-slate-200 p-4">
            <summary className="cursor-pointer font-medium">{invite.usedCount} / {invite.maxUses} registrations · {invite.isActive ? "Active" : "Disabled"}<span className="ml-2 text-xs font-normal text-slate-500">{invite.id}</span></summary>
            <ActionForm action={saveInviteAction} label="Update invitation">
              <input type="hidden" name="id" value={invite.id} />
              <label>Total registration limit<input name="maxUses" type="number" min={Math.max(1, invite.usedCount)} max={10000} defaultValue={invite.maxUses} required /></label>
              <label>Replacement code<input name="code" minLength={16} maxLength={80} autoComplete="off" /><span className="font-normal text-slate-500">Leave blank to keep the code. Replacing a code preserves its registration count.</span></label>
              <label><input name="isActive" type="checkbox" defaultChecked={invite.isActive} />Active</label>
            </ActionForm>
          </details>
        ))}
      </section>
      <section aria-labelledby="member-permissions">
        <h2 id="member-permissions" className="text-xl font-semibold">Comment permissions ({users.length} members)</h2>
        <p className="mt-2 text-sm text-slate-600">New members can comment by default. Blocking comments does not stop reading, liking, or sharing.</p>
        {users.length === 0 && <p className="mt-3 text-slate-500">Members will appear after they register with an invitation.</p>}
        {users.map((user) => (
          <div key={user.id} className="my-3 rounded-lg border border-slate-200 p-4">
            <p className="font-semibold">{user.username}</p><p className="text-sm text-slate-500">{user.email}</p>
            <ActionForm action={setCommentPermissionAction} label="Save permission"><input type="hidden" name="userId" value={user.id} /><label><input name="canComment" type="checkbox" defaultChecked={user.canComment} />Allow commenting</label></ActionForm>
          </div>
        ))}
      </section>
      <section aria-labelledby="moderate-comments">
        <h2 id="moderate-comments" className="text-xl font-semibold">Latest 50 comments</h2>
        {comments.length === 0 && <p className="mt-3 text-slate-500">No comments to review.</p>}
        {comments.map((comment) => (
          <div key={comment.id} className="my-4 rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-medium">{comment.user.username} · {comment.content.status === "published" ? <Link href={`/blog/${comment.content.slug}`} className="text-teal-700 underline">{comment.content.title}</Link> : comment.content.title}</p>
            <p className="mt-3 whitespace-pre-wrap break-words">{comment.body}</p>
            <ActionForm action={deleteCommentAction} label="Remove comment" danger confirmText="Remove this comment?"><input type="hidden" name="id" value={comment.id} /></ActionForm>
          </div>
        ))}
      </section>
    </div>
  );
}
