import { Suspense } from "react";
import Link from "next/link";
import MemberManagement from "@/components/admin/member-management";

export default function MembersPage() {
  return <main className="mx-auto max-w-4xl px-6 py-16"><Link href="/admin" className="text-sm text-teal-700 underline">Back to dashboard</Link><Suspense fallback={<p className="mt-6">Loading members…</p>}><MemberManagement /></Suspense></main>;
}
