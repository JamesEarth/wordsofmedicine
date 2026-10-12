import Link from "next/link";
import { Suspense } from "react";
import AccountControls from "@/components/account-controls";
export default function Header() {
    return(

        <header className="border-b border-slate-200 bg-white px-6">
            <nav aria-label="Main navigation" className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 py-4">
                <Link href="/" className="text-xl font-bold text-teal-700">
                    Words of Medicine
                </Link>

                <div className="flex gap-6 text-slate-600">
                    <Link href="/"> Home </Link>
                    <Link href="/#topics">Topics</Link>
                </div>
                <Suspense fallback={<span className="text-sm text-slate-500">Loading account…</span>}>
                    <AccountControls />
                </Suspense>
            </nav>

        </header>
    );
}
