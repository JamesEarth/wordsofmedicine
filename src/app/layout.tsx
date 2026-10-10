import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  icons: { icon: "/icon.svg" },
  title: { default: "Words of Medicine — Health, in simple words", template: "%s | Words of Medicine" },
  description: "Understand your health, one clear answer at a time. Explore educational guides to medicines, diseases, medical instruments, first aid, and everyday wellbeing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Suspense fallback={<div className="page-loading" role="status"><span className="loading-mark">+</span><p>Opening Words of Medicine…</p></div>}>{children}</Suspense></body></html>;
}
