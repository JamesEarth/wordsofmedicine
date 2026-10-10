"use client";

import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function AdminError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <div className="admin-error-page"><TriangleAlert size={35} strokeWidth={1.5} /><h1>Something interrupted your studio.</h1><p>Please try again. If the problem continues, check your server connection.</p><div className="admin-button-group"><button type="button" className="admin-button" onClick={retry}><RotateCcw size={16} />Try again</button><Link href="/admin" className="admin-button admin-button-secondary">Return to library</Link></div></div>;
}
