"use client";

import Link from "next/link";
import { HeartPulse, RotateCcw } from "lucide-react";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main id="main-content" className="not-found container"><HeartPulse size={45} strokeWidth={1.2} /><span className="overline">A LITTLE INTERRUPTION</span><h1>This page needs another moment.</h1><p>Something prevented the page from loading. Please try again.</p><button type="button" className="primary-button" onClick={retry}>Try again<RotateCcw size={16} /></button><Link href="/" className="text-link">Return to the homepage</Link></main>;
}
