import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default function NotFound() {
  return <main id="main-content" className="not-found container"><BookOpen size={48} strokeWidth={1.2} /><span className="overline">A PAGE WE COULDN’T FIND</span><h1>Let’s find a helpful place to start.</h1><p>This page may have moved, or the guide may not be available. There is still plenty to explore in the library.</p><Link href="/library" className="primary-button">Explore the library<ArrowRight size={17} /></Link><Link href="/" className="text-link">Return to the homepage</Link></main>;
}
