import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PublicShell } from "@/components/public-ui";
import { getSettings } from "@/lib/db";

export const metadata: Metadata = { title: "Privacy", description: "How this website handles browsing, searches, administrator sessions, and external resources." };

export default async function PrivacyPage() {
  await connection();
  const settings = await getSettings();
  return <PublicShell settings={settings}><main id="main-content" className="prose-page container narrow-prose"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Privacy</span></nav><span className="overline">A LITTLE TRANSPARENCY</span><h1>Your privacy matters.</h1><p className="about-lead">Here is how {settings.siteName} handles information when you use this website.</p><div className="article-body">
    <h2>Reading the public library</h2><p>You can read and search the public guides without creating an account. The application does not include analytics trackers, advertising trackers, a public account system, or a newsletter subscription service.</p>
    <h2>Searches and server records</h2><p>Search terms and filters appear in the page URL. They may remain in your browser history and may be recorded in the hosting provider’s request logs. Hosting systems may also process your IP address, browser information, and request times to operate the website. Please avoid entering personal or sensitive medical details in search.</p>
    <h2>Administrator access</h2><p>Administrator accounts store an email address, display name, and a protected password hash. Signing in creates an essential session cookie named <code>wom_admin_session</code>. It is inaccessible to page scripts and expires after eight hours. Signing out removes the session cookie and invalidates the stored session.</p><p>Sign-in attempts are rate limited using a hashed identifier and timestamps. These records support access security. No public visitor login is required to browse the website.</p>
    <h2>Images and links to other websites</h2><p>Some images may be loaded from external image providers. Loading these images can share your IP address and technical request information with those providers. Source links take you to other websites, which have their own privacy practices. This website does not control those external services.</p>
    <h2>Contacting us</h2><p>If you contact the website by email, your email provider and the recipient’s email provider process that message. Share only the information needed for website feedback, and do not include private medical records.</p>{settings.contactEmail && <p>For privacy questions, contact <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>.</p>}
    <h2>Changes to the website</h2><p>This notice describes the features currently included in the application. It should be updated if the website owner adds analytics, advertising, public accounts, subscriptions, or other services that collect information.</p>
  </div></main></PublicShell>;
}
