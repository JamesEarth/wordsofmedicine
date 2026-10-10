import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, BookOpen, HeartHandshake, Search } from "lucide-react";
import { PublicShell } from "@/components/public-ui";
import { getSettings } from "@/lib/db";

export const metadata: Metadata = { title: "About us", description: "Learn about our purpose and approach to approachable, clearly sourced health education." };

export default async function AboutPage() {
  await connection();
  const settings = await getSettings();
  return <PublicShell settings={settings}><main id="main-content" className="prose-page container narrow-prose"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>About us</span></nav><span className="overline">KNOWLEDGE THAT CARES</span><h1>{settings.missionTitle}</h1><p className="about-lead">{settings.missionDescription}</p>
    <div className="article-body">{settings.aboutText.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    <div className="about-values"><div><BookOpen size={27} strokeWidth={1.4} /><h2>Clarity comes first.</h2><p>Useful introductions to medicines, conditions, instruments, and everyday health, written to make unfamiliar ideas easier to understand.</p></div><div><Search size={27} strokeWidth={1.4} /><h2>Follow the source.</h2><p>Source links help you explore the original information, check the context, and keep learning beyond an introduction.</p></div><div><HeartHandshake size={27} strokeWidth={1.4} /><h2>Care has context.</h2><p>Everyone’s circumstances are different. General education can help you prepare questions for a qualified health professional.</p></div></div>
    <section className="article-body" id="editorial"><h2>Our editorial approach</h2><p>This library is an educational starting point. Each published guide includes a source so you can consult the original resource. The starter guides have not been independently reviewed by a clinician, and we do not label them as medically reviewed.</p><p>Our administrator can update and expand the library. A guide’s “updated” date reflects its latest edit; it is not a date of clinical review. Information can change, and the linked source may contain newer details.</p><p>{settings.disclaimer}</p></section>
    {settings.contactEmail && <section className="article-body"><h2>Help us make it better.</h2><p>Found an error or have a question about the website? Contact <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>. Please avoid sending personal medical details; this inbox is for website feedback and is not a clinical service.</p></section>}
    <Link href="/library" className="primary-button">Explore the health library<ArrowRight size={17} /></Link>
  </main></PublicShell>;
}
