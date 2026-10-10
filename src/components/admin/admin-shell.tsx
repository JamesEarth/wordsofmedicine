import Link from "next/link";
import { ArrowUpRight, BookOpen, HeartPulse, LayoutDashboard, Settings2 } from "lucide-react";
import { logoutAction } from "@/lib/admin-actions";
import { LogoutButton } from "@/components/admin/form-controls";

type Props = {
  children: React.ReactNode;
  active?: "content" | "settings";
  displayName?: string | null;
  email: string;
  siteName?: string;
};

export function AdminShell({ children, active = "content", displayName, email, siteName = "Words of Medicine" }: Props) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span className="admin-brand-icon"><HeartPulse size={25} strokeWidth={1.7} /></span>
          <span>{siteName}<small>CONTENT STUDIO</small></span>
        </Link>
        <p className="admin-nav-label">YOUR WORKSPACE</p>
        <nav className="admin-nav" aria-label="Administration">
          <Link href="/admin" className={active === "content" ? "admin-nav-active" : ""} aria-current={active === "content" ? "page" : undefined}><LayoutDashboard size={19} /> Content library</Link>
          <Link href="/admin/settings" className={active === "settings" ? "admin-nav-active" : ""} aria-current={active === "settings" ? "page" : undefined}><Settings2 size={19} /> Site settings</Link>
          <Link href="/" target="_blank" rel="noopener noreferrer"><ArrowUpRight size={19} /> View public website</Link>
        </nav>
        <div className="admin-sidebar-note"><BookOpen size={22} /><p>A little knowledge.<br />A healthier world.</p><span>Your space to make trusted information easier to find.</span></div>
        <div className="admin-account"><span className="admin-avatar">{(displayName || email).charAt(0).toUpperCase()}</span><div><strong>{displayName || "Administrator"}</strong><span>{email}</span></div><form action={logoutAction}><LogoutButton /></form></div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
