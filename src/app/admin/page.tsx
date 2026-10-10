import Link from "next/link";
import { BookOpen, CheckCircle2, FileText, Plus, Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSettings, listAdminContent } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentLibrary } from "@/components/admin/content-library";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const admin = await requireAdmin();
  const [entries, settings, query] = await Promise.all([listAdminContent(), getSettings(), searchParams]);
  const stats = [
    { label: "Total content", value: entries.length, icon: BookOpen, className: "green" },
    { label: "Published", value: entries.filter((entry) => entry.status === "published").length, icon: CheckCircle2, className: "sage" },
    { label: "Drafts", value: entries.filter((entry) => entry.status === "draft").length, icon: FileText, className: "amber" },
    { label: "Featured", value: entries.filter((entry) => entry.featured && entry.status === "published").length, icon: Star, className: "rose" },
  ];
  return <AdminShell email={admin.email} displayName={admin.displayName} siteName={settings.siteName}>
    <header className="admin-page-heading"><div><span className="admin-eyebrow">CONTENT STUDIO</span><h1>A healthier library starts here.</h1><p>Welcome back. Make good information accessible to everyone.</p></div><Link href="/admin/content/new" className="admin-button"><Plus size={18} /> Create content</Link></header>
    {query.success && ["saved", "deleted"].includes(query.success) && <div className="admin-feedback admin-feedback-success" role="status"><CheckCircle2 size={18} />{query.success === "saved" ? "Your content has been saved." : "Content has been deleted."}</div>}
    <div className="admin-stats">{stats.map((stat) => <div key={stat.label} className="admin-stat"><span className={`admin-stat-icon admin-stat-${stat.className}`}><stat.icon size={21} strokeWidth={1.7} /></span><div><span>{stat.label}</span><strong>{stat.value}</strong></div></div>)}</div>
    <ContentLibrary entries={entries} />
    <p className="admin-bottom-note">Published changes appear on your public website immediately. Drafts stay private.</p>
  </AdminShell>;
}
