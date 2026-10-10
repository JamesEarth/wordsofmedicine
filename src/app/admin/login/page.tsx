import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, HeartPulse, LockKeyhole, Terminal } from "lucide-react";
import { getAdminSession, isAdminConfigured } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { LoginForm, RefreshLoginButton } from "@/components/admin/login-form";

export const metadata = { title: "Administrator sign in" };

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  const [configured, settings] = await Promise.all([isAdminConfigured(), getSettings()]);
  return <main className="admin-login-page"><section className="admin-login-story"><Link className="admin-brand" href="/"><span className="admin-brand-icon"><HeartPulse size={26} strokeWidth={1.5} /></span><span>{settings.siteName}<small>KNOWLEDGE THAT CARES</small></span></Link><div className="admin-login-story-content"><span className="admin-login-illustration"><BookOpen size={70} strokeWidth={1} /><span>+</span></span><span className="admin-eyebrow">BEHIND EVERY HELPFUL PAGE</span><h1>A little care.<br />A world of difference.</h1><p>Your space to create, curate, and share health knowledge that helps people every day.</p></div><span className="admin-login-story-footer">{settings.siteName} · Content studio</span></section><section className="admin-login-side"><Link href="/" className="admin-back-link"><ArrowLeft size={16} />Back to the website</Link><div className="admin-login-card"><span className="admin-login-lock"><LockKeyhole size={23} strokeWidth={1.6} /></span><span className="admin-eyebrow">YOUR CONTENT STUDIO</span><h2>{configured ? "Welcome back." : "Make yourself at home."}</h2><p>{configured ? "Sign in to look after your content and your community." : "Your website is ready. Create your administrator account to start editing."}</p>{configured ? <LoginForm /> : <div className="admin-setup-box"><Terminal size={23} /><h3>Create your administrator</h3><p>In this project’s terminal, run:</p><code>npm run admin:create</code><p>Choose your email and password, then refresh this page to sign in.</p><RefreshLoginButton /></div>}</div><p className="admin-login-footnote">Thoughtfully made for a healthier, better-informed world.</p></section></main>;
}
