"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/lib/admin-actions";

type Props = {
  action: (
    previous: ActionState,
    form: FormData
  ) => Promise<ActionState>;
  children: ReactNode;
  label: string;
  confirmText?: string;
  resetOnSuccess?: boolean;
  danger?: boolean;
};

export default function ActionForm({
  action,
  children,
  label,
  confirmText,
  resetOnSuccess = false,
  danger = false,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.success) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      action={formAction}
      ref={formRef}
      className="my-4 flex flex-col gap-4 [&_label]:flex [&_label]:flex-col [&_label]:gap-2 [&_label]:text-sm [&_label]:font-medium [&_input:not([type=checkbox]):not([type=hidden])]:w-full [&_input:not([type=checkbox]):not([type=hidden])]:rounded-lg [&_input:not([type=checkbox]):not([type=hidden])]:border [&_input:not([type=checkbox]):not([type=hidden])]:border-slate-300 [&_input:not([type=checkbox]):not([type=hidden])]:p-3 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-3 [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-300 [&_select]:p-3 [&_input[type=checkbox]]:size-4 [&_input[type=checkbox]]:accent-teal-700"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        if (confirmText && !window.confirm(confirmText)) {
          return;
        }
        // Keep entered values after validation errors; reset only on success.
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {children}

      {state.error && (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="max-h-64 overflow-auto break-all whitespace-pre-wrap rounded-lg bg-teal-50 p-3 text-sm text-teal-800">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`self-start rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50 ${danger ? "bg-red-700 hover:bg-red-800" : "bg-teal-700 hover:bg-teal-800"}`}
      >
        {pending ? "Please wait…" : label}
      </button>
    </form>
  );
}
