import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminContent, getSettings } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentForm } from "@/components/admin/content-form";

export const metadata = { title: "Edit content" };

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [entry, settings] = await Promise.all([getAdminContent(id), getSettings()]);
  if (!entry) notFound();
  return <AdminShell email={admin.email} displayName={admin.displayName} siteName={settings.siteName}><Link href="/admin" className="admin-back-link"><ArrowLeft size={16} />Content library</Link><header className="admin-page-heading"><div><span className="admin-eyebrow">KEEP GOOD INFORMATION GROWING</span><h1>Edit content</h1><p>Update your guide, then save to make your changes live.</p></div>{entry.status === "published" && <Link href={`/library/${entry.slug}`} target="_blank" rel="noopener noreferrer" className="admin-button admin-button-secondary">View page<ArrowUpRight size={17} /></Link>}</header><ContentForm entry={entry} /></AdminShell>;
}
