import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContentForm } from "@/components/admin/content-form";

export const metadata = { title: "Create content" };

export default async function NewContentPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();
  return <AdminShell email={admin.email} displayName={admin.displayName} siteName={settings.siteName}><Link href="/admin" className="admin-back-link"><ArrowLeft size={16} />Content library</Link><header className="admin-page-heading"><div><span className="admin-eyebrow">A NEW PAGE OF KNOWLEDGE</span><h1>Create content</h1><p>Turn helpful information into an accessible guide.</p></div></header><ContentForm /></AdminShell>;
}
