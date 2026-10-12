import ActionForm from "@/components/action-form";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/user-auth";
import { safeReturnPath } from "@/lib/return-path";
import {
  loginUserAction,
  registerUserAction,
} from "@/lib/member-actions";

type Props = { searchParams: Promise<{ next?: string }> };

export default function LoginPage(props: Props) {
  return <main className="mx-auto max-w-md px-6 py-16"><Suspense fallback={<p>Loading account…</p>}><LoginForms {...props} /></Suspense></main>;
}

async function LoginForms({ searchParams }: Props) {
  const next = safeReturnPath((await searchParams).next);
  if (await getUserSession()) redirect(next);
  return (
    <div>
      <h1 className="text-2xl font-bold">Member login</h1>
      <p className="mt-3 text-slate-600">Sign in to read member articles and join the conversation.</p>

      <ActionForm action={loginUserAction} label="Sign in">
        <input type="hidden" name="next" value={next} />
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={1024}
            required
          />
        </label>
      </ActionForm>

      <h2 className="mt-12 text-xl font-semibold">
        Register with an invitation
      </h2>

      <p className="mt-3 text-sm text-slate-600">Use an invitation from the site administrator to create your account.</p>
      <ActionForm action={registerUserAction} label="Create account" resetOnSuccess>
        <label>
          Username
          <input name="username" minLength={3} maxLength={30} required />
        </label>

        <label>
          Email
          <input name="email" type="email" maxLength={254} required />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={1024}
            required
          />
        </label>

        <label>
          Invitation code
          <input
            name="invitationCode"
            minLength={16}
            maxLength={80}
            required
          />
        </label>
      </ActionForm>
    </div>
  );
}
