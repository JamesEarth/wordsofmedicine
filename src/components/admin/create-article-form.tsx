"use client";

import { startTransition, useActionState } from "react";
import { saveContentAction } from "@/lib/admin-actions";

const inputClass = "rounded-lg border border-slate-300 p-3";

export default function CreateArticleForm() {
  const [state, formAction, pending] = useActionState(saveContentAction, {});

  return (
    <form
      method="post"
      className="mt-6 flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        startTransition(() => {
          formAction(formData);
        });
      }}
    >
      <input type="hidden" name="status" value="draft" />

      <label className="flex flex-col gap-2">
        Article title
        <input
          name="title"
          required
          maxLength={200}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        URL slug
        <input
          name="slug"
          required
          maxLength={150}
          placeholder="my-first-article"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        Category
        <select
          name="category"
          defaultValue="medicines"
          className={inputClass}
        >
          <option value="medicines">Medicines</option>
          <option value="conditions">Conditions</option>
          <option value="instruments">Medical instruments</option>
          <option value="wellness">Wellness</option>
          <option value="first-aid">First aid</option>
        </select>
      </label>

      <label className="flex flex-col gap-2">
        Short summary
        <textarea
          name="summary"
          required
          rows={3}
          maxLength={1000}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        Article content
        <textarea
          name="body"
          required
          rows={8}
          maxLength={100000}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        Reading time in minutes
        <input
          type="number"
          name="readTime"
          defaultValue={5}
          min={1}
          max={120}
          step={1}
          required
          className={inputClass}
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
        {pending ? "Saving…" : "Save draft"}
      </button>
    </form>
  );
}
