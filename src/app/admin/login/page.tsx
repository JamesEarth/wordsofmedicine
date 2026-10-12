"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/admin-actions";

export default function AdminLoginPage() {
    const [state, formAction, pending] = useActionState(loginAction, {});
    return (
        <main className="mx-auto max-w-md px-6 py-16">
            <h1 className="text-2xl focus-within:font-bold">Admin login</h1>

            <form action={formAction} className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                    <span>Email</span>
                    <input
                        type="email"
                        name="email"
                        className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span>Password</span>
                    <input
                        type="password"
                        name="password"
                        className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-1"
                    />
                </label>

                {state?.error && (
                    <p className="text-sm text-red-600">{state.error}</p>
                )}

                <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-teal-700 p-3 font-semibold text-white disabled:opacity-50"
                >
                    {pending ? "Logging in…" : "Log in"}
                </button>
            </form>


        </main>
    );
}