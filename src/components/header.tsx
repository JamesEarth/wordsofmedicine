import Link from "next/link";
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
            </nav>

        </header>
    );
}