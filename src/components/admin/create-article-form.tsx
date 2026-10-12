import Link from "next/link";
import type { Content } from "@/lib/db";
import { saveContentAction } from "@/lib/admin-actions";
import ActionForm from "@/components/action-form";

const textFields = [
  ["title", "Article title", 200, true],
  ["slug", "URL slug", 150, true],
  ["imageUrl", "Image URL or local image path", 2000, false],
  ["tag", "Tag", 80, false],
  ["sourceName", "Source name", 200, false],
  ["sourceUrl", "Source URL (HTTPS)", 2000, false],
] as const;

export default function CreateArticleForm({ article }: { article?: Content }) {
  return (
    <>
      <p className="mt-3 text-sm text-slate-600">Save a draft at any time. Published health articles need a source name and HTTPS source URL.</p>
      <ActionForm action={saveContentAction} label={article ? "Save changes" : "Save article"}>
        <input type="hidden" name="id" value={article?.id ?? ""} />
        {textFields.map(([name, label, maxLength, required]) => (
          <label key={name}>
            {label}
            <input name={name} defaultValue={article?.[name] ?? ""} maxLength={maxLength} required={required} />
          </label>
        ))}
        <label>Category
          <select name="category" defaultValue={article?.category ?? "medicines"}>
            <option value="medicines">Medicines</option>
            <option value="conditions">Conditions</option>
            <option value="instruments">Medical instruments</option>
            <option value="wellness">Wellness</option>
            <option value="first-aid">First aid</option>
          </select>
        </label>
        <label>Short summary
          <textarea name="summary" defaultValue={article?.summary ?? ""} maxLength={1000} rows={3} required />
          <span className="font-normal text-slate-500">This preview is public, including for members-only articles.</span>
        </label>
        <label>Article content
          <textarea name="body" defaultValue={article?.body ?? ""} maxLength={100000} rows={12} required />
        </label>
        <label>Reading time in minutes
          <input name="readTime" type="number" defaultValue={article?.readTime ?? 5} min={1} max={120} step={1} required />
        </label>
        <label>Status
          <select name="status" defaultValue={article?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <fieldset className="grid gap-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-2 font-semibold">Article options</legend>
          <label><input name="featured" type="checkbox" defaultChecked={article?.featured ?? false} />Featured article</label>
          <label><input name="requiresLogin" type="checkbox" defaultChecked={article?.requiresLogin ?? false} />Require member login to read</label>
          <label><input name="commentsEnabled" type="checkbox" defaultChecked={article?.commentsEnabled ?? true} />Allow new comments</label>
        </fieldset>
      </ActionForm>
      <Link href="/admin" className="text-sm text-slate-600 underline">Back to dashboard</Link>
    </>
  );
}
