"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, FilePenLine, LoaderCircle, Save, Trash2 } from "lucide-react";
import { deleteContentAction, saveContentAction } from "@/lib/admin-actions";
import type { Content } from "@/lib/db";
import { contentCategories } from "@/components/admin/content-library";
import { FormFeedback } from "@/components/admin/form-controls";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function ContentForm({ entry }: { entry?: Content }) {
  const [state, formAction, pending] = useActionState(saveContentAction, {});
  const [title, setTitle] = useState(entry?.title || "");
  const [slug, setSlug] = useState(entry?.slug || "");
  const [slugEdited, setSlugEdited] = useState(!!entry);
  const [body, setBody] = useState(entry?.body || "");
  const [preview, setPreview] = useState(false);
  const [values, setValues] = useState({
    summary: entry?.summary || "",
    status: entry?.status || "draft",
    featured: entry?.featured || false,
    category: entry?.category || "medicines",
    tag: entry?.tag || "",
    readTime: String(entry?.readTime || 5),
    imageUrl: entry?.imageUrl || "",
    sourceName: entry?.sourceName || "",
    sourceUrl: entry?.sourceUrl || "",
  });
  function updateField(field: keyof typeof values, value: string | boolean) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  return <>
    <form action={formAction} className="admin-editor-form">
      {entry && <input type="hidden" name="id" value={entry.id} />}
      <div className="admin-editor-grid">
        <div className="admin-editor-main">
          <section className="admin-panel admin-form-panel">
            <div className="admin-section-label"><FilePenLine size={18} /><h2>The essentials</h2></div>
            <div className="admin-field"><label htmlFor="content-title">Title <span>*</span></label><input id="content-title" name="title" placeholder="Give your guide a clear, helpful title" required maxLength={200} value={title} onChange={(event) => { setTitle(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} /></div>
            <div className="admin-field"><label htmlFor="content-slug">Page address <span>*</span></label><div className="admin-input-prefix"><span>/library/</span><input id="content-slug" name="slug" required maxLength={150} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value); }} /></div><small>Use lowercase letters, numbers, and hyphens.</small></div>
            <div className="admin-field"><label htmlFor="content-summary">Short description <span>*</span></label><textarea id="content-summary" name="summary" rows={3} required maxLength={1000} placeholder="A short introduction for the cards and search results." value={values.summary} onChange={(event) => updateField("summary", event.target.value)} /></div>
          </section>
          <section className="admin-panel admin-form-panel">
            <div className="admin-panel-heading admin-editor-heading"><div><h2>Write your content</h2><p>Make complex information clear and approachable.</p></div><button type="button" className="admin-button admin-button-small admin-button-secondary" onClick={() => setPreview(!preview)}>{preview ? <FilePenLine size={16} /> : <Eye size={16} />}{preview ? "Edit" : "Preview"}</button></div>
            <div className="admin-field"><label className="admin-sr-only" htmlFor="content-body">Main content</label><textarea id="content-body" className={`admin-body-input ${preview ? "admin-hidden" : ""}`} name="body" rows={20} required={!preview} maxLength={100000} value={body} onChange={(event) => setBody(event.target.value)} placeholder={"Start with a helpful introduction.\n\n## What to know\n\nWrite your content here…"} /><small>Separate paragraphs with a blank line. Use ## for section headings and - for list items. Content is saved as text.</small></div>
            {preview && <div className="admin-content-preview"><h3>{title || "Your title"}</h3>{body ? body.split(/\n\n+/).map((paragraph, index) => paragraph.startsWith("## ") ? <h4 key={index}>{paragraph.slice(3)}</h4> : paragraph.split("\n").every((line) => line.startsWith("- ")) ? <ul key={index}>{paragraph.split("\n").map((line, item) => <li key={item}>{line.slice(2)}</li>)}</ul> : <p key={index}>{paragraph}</p>) : <p>Your content preview will appear here.</p>}</div>}
          </section>
          <section className="admin-panel admin-form-panel">
            <h2>References</h2><p className="admin-panel-description">Add a source name and HTTPS link before publishing. References are optional for drafts.</p>
            <div className="admin-field-row"><div className="admin-field"><label htmlFor="source-name">Source name</label><input id="source-name" name="sourceName" placeholder="e.g. World Health Organization" value={values.sourceName} onChange={(event) => updateField("sourceName", event.target.value)} maxLength={200} required={values.status === "published"} /></div><div className="admin-field"><label htmlFor="source-url">Source URL</label><input id="source-url" name="sourceUrl" type="url" placeholder="https://…" value={values.sourceUrl} onChange={(event) => updateField("sourceUrl", event.target.value)} maxLength={2000} pattern="https://.*" required={values.status === "published"} /></div></div>
          </section>
        </div>
        <aside className="admin-editor-aside">
          <section className="admin-panel admin-form-panel"><h2>Publishing</h2><div className="admin-field"><label htmlFor="content-status">Visibility</label><select id="content-status" name="status" value={values.status} onChange={(event) => updateField("status", event.target.value)}><option value="draft">Draft — only visible to you</option><option value="published">Published — public</option></select></div><label className="admin-checkbox"><input name="featured" type="checkbox" checked={values.featured} onChange={(event) => updateField("featured", event.target.checked)} /><span><strong>Feature on the homepage</strong><small>Highlight this entry when published.</small></span></label><FormFeedback state={state} /><button type="submit" className="admin-button admin-button-wide" disabled={pending}>{pending ? <LoaderCircle size={17} className="admin-spin" /> : <Save size={17} />}{pending ? "Saving…" : "Save content"}</button><Link href="/admin" className="admin-cancel-link">Cancel and return to library</Link></section>
          <section className="admin-panel admin-form-panel"><h2>Organize</h2><div className="admin-field"><label htmlFor="content-category">Category <span>*</span></label><select id="content-category" name="category" required value={values.category} onChange={(event) => updateField("category", event.target.value)}>{contentCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></div><div className="admin-field"><label htmlFor="content-tag">Topic label</label><input id="content-tag" name="tag" value={values.tag} onChange={(event) => updateField("tag", event.target.value)} placeholder="e.g. Everyday health" maxLength={80} /></div><div className="admin-field"><label htmlFor="content-read-time">Reading time (minutes)</label><input id="content-read-time" name="readTime" type="number" min={1} max={120} required value={values.readTime} onChange={(event) => updateField("readTime", event.target.value)} /></div></section>
          <section className="admin-panel admin-form-panel"><h2>Cover image</h2><div className="admin-field"><label htmlFor="content-image">Image URL</label><input id="content-image" name="imageUrl" placeholder="https://… or /images/photo.jpg" value={values.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} maxLength={2000} /><small>Use an HTTPS image URL or a path to an image in your website.</small></div></section>
        </aside>
      </div>
    </form>
    {entry && <DeleteContent id={entry.id} title={entry.title} />}
  </>;
}

function DeleteContent({ id, title }: { id: string; title: string }) {
  const [confirm, setConfirm] = useState(false);
  const [state, formAction, pending] = useActionState(deleteContentAction, {});
  return <section className="admin-delete-panel"><div><h2>Delete this content</h2><p>This permanently removes the entry from your library and public website.</p></div>{confirm ? <form action={formAction}><input type="hidden" name="id" value={id} /><p>Delete “{title}”?</p><div className="admin-button-group"><button className="admin-button admin-button-danger" disabled={pending} type="submit">{pending ? "Deleting…" : "Delete permanently"}</button><button className="admin-button admin-button-secondary" disabled={pending} type="button" onClick={() => setConfirm(false)}>Cancel</button></div><FormFeedback state={state} /></form> : <button type="button" className="admin-button admin-button-danger-outline" onClick={() => setConfirm(true)}><Trash2 size={16} />Delete content</button>}</section>;
}
