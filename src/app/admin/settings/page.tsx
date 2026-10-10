import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Site settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();
  return <AdminShell active="settings" email={admin.email} displayName={admin.displayName} siteName={settings.siteName}><header className="admin-page-heading"><div><span className="admin-eyebrow">THE DETAILS MATTER</span><h1>Site settings</h1><p>Shape your website’s identity, homepage, and message.</p></div></header><SettingsForm settings={settings} /></AdminShell>;
}
