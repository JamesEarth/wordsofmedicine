"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, BookOpen, FilePenLine, Search, Star, X } from "lucide-react";
import type { Content } from "@/lib/db";

export const contentCategories = [
  { value: "medicines", label: "Medicines" },
  { value: "conditions", label: "Conditions" },
  { value: "instruments", label: "Instruments" },
  { value: "wellness", label: "Wellness" },
  { value: "first-aid", label: "First aid" },
];

export function ContentLibrary({ entries }: { entries: Content[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const filtered = entries.filter((entry) => (category === "all" || entry.category === category) && (status === "all" || entry.status === status) && `${entry.title} ${entry.summary} ${entry.tag}`.toLowerCase().includes(query.toLowerCase().trim()));

  return (
    <section className="admin-panel admin-library">
      <div className="admin-panel-heading"><div><h2>Your content</h2><p>Keep every guide, article, and resource up to date.</p></div><span className="admin-count">{entries.length} entries</span></div>
      <div className="admin-filters">
        <label className="admin-search"><Search size={19} /><span className="admin-sr-only">Search content</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your content…" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</label>
        <label><span className="admin-sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{contentCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label><span className="admin-sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select></label>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-table"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Last updated</th><th><span className="admin-sr-only">Actions</span></th></tr></thead><tbody>
          {filtered.map((entry) => <tr key={entry.id}>
            <td><Link href={`/admin/content/${entry.id}`} className="admin-entry-title">{entry.title}{entry.featured && <Star size={13} className="admin-featured-icon" aria-label="Featured" />}</Link><span className="admin-entry-slug">/{entry.slug}</span></td>
            <td><span className="admin-category-label">{contentCategories.find((item) => item.value === entry.category)?.label || entry.category}</span></td>
            <td><span className={`admin-status admin-status-${entry.status}`}><span />{entry.status === "published" ? "Published" : "Draft"}</span></td>
            <td className="admin-date">{new Date(entry.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</td>
            <td><div className="admin-row-actions"><Link href={`/admin/content/${entry.id}`} className="admin-icon-button" aria-label={`Edit ${entry.title}`} title="Edit content"><FilePenLine size={17} /></Link>{entry.status === "published" && <Link href={`/library/${entry.slug}`} className="admin-icon-button" target="_blank" rel="noopener noreferrer" aria-label={`View ${entry.title}`} title="View published page"><ArrowUpRight size={18} /></Link>}</div></td>
          </tr>)}
        </tbody></table>
      </div>
      {!filtered.length && <div className="admin-empty"><BookOpen size={35} strokeWidth={1.3} /><h3>{entries.length ? "No matching content" : "Your library starts here"}</h3><p>{entries.length ? "Try a different search or adjust your filters." : "Create your first guide and share something helpful."}</p>{entries.length > 0 ? <button type="button" className="admin-button admin-button-secondary" onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); }}>Clear filters</button> : <Link href="/admin/content/new" className="admin-button">Create content</Link>}</div>}
      <div className="admin-table-footer">Showing {filtered.length} of {entries.length} entries<span><Star size={13} /> Featured on the homepage</span></div>
    </section>
  );
}
