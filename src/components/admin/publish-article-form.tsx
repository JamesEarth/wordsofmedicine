"use client";

import { startTransition, useActionState } from "react";
import { publishContentAction } from "@/lib/admin-actions";

export default function PublishArticleForm({
  articleId,
}: {
  articleId: string;
}) {
  const [state, formAction, pending] = useActionState(publishContentAction, {});

  return (
    <form
      method="post"
      className="mt-4 flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        startTransition(() => {
          formAction(formData);
        });
      }}
    >
      <input type="hidden" name="id" value={articleId} />

      <label className="flex flex-col gap-2">
        Source name
        <input
          name="sourceName"
          required
          maxLength={200}
          className="rounded-lg border border-slate-300 p-3"
        />
      </label>

      <label className="flex flex-col gap-2">
        Source URL
        <input
          type="url"
          name="sourceUrl"
          required
          maxLength={2000}
          placeholder="https://example.com/article"
          className="rounded-lg border border-slate-300 p-3"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-700 p-3 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Publishing…" : "Publish article"}
      </button>
    </form>
  );
}
