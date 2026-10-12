import Link from "next/link";
import { getUserSession } from "@/lib/user-auth";
import { getAdminSession } from "@/lib/auth";
import { logoutUserAction } from "@/lib/member-actions";

export default async function AccountControls() {
  const [user, admin] = await Promise.all([getUserSession(), getAdminSession()]);

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {admin && <Link href="/admin" className="font-semibold text-teal-700">Dashboard</Link>}
      {user ? (
        <>
          <span className="text-slate-600">{user.displayName ?? user.username}</span>
          <form action={logoutUserAction}><button type="submit" className="underline">Sign out</button></form>
        </>
      ) : (
        <Link href="/login" className="rounded-lg bg-teal-700 px-4 py-2 text-white">Member login</Link>
      )}
    </div>
  );
}
