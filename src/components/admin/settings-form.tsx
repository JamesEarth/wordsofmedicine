"use client";

import { useActionState, useState } from "react";
import { Globe2, Image, LayoutTemplate, LoaderCircle, Save, Type } from "lucide-react";
import { saveSettingsAction } from "@/lib/admin-actions";
import type { SiteSettings } from "@/lib/db";
import { FormFeedback } from "@/components/admin/form-controls";

type SettingField = { name: keyof SiteSettings; label: string; multiline?: boolean; hint?: string; type?: string; required?: boolean };

const fieldLimits: Record<string, number> = {
  siteName: 100, tagline: 200, contactEmail: 254, aboutText: 10000,
  heroEyebrow: 150, heroTitle: 250, heroDescription: 1000, heroImageUrl: 2000, heroImageCaption: 250,
  topicsTitle: 250, topicsDescription: 1000, featuredTitle: 250, featuredDescription: 1000,
  indexTitle: 250, indexDescription: 1000, missionTitle: 250, missionDescription: 2000,
  footerText: 1000, disclaimer: 2000,
};

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, {});
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, String(value ?? "")])));
  const groups: { title: string; description: string; icon: typeof Globe2; fields: SettingField[] }[] = [
    { title: "Site identity", description: "The name and details that make this website yours.", icon: Globe2, fields: [
      { name: "siteName", label: "Website name", required: true },
      { name: "tagline", label: "Tagline", required: true },
      { name: "contactEmail", label: "Contact email", type: "email" },
      { name: "aboutText", label: "About this website", multiline: true, required: true },
    ] },
    { title: "Homepage introduction", description: "Set the first impression with a welcoming headline and image.", icon: Image, fields: [
      { name: "heroEyebrow", label: "Small introductory label", required: true },
      { name: "heroTitle", label: "Main headline", multiline: true, required: true, hint: "Add a line break to split the headline across lines." },
      { name: "heroDescription", label: "Introduction", multiline: true, required: true },
      { name: "heroImageUrl", label: "Homepage image URL", hint: "An HTTPS URL or a path to a website image, such as /images/hero.jpg." },
      { name: "heroImageCaption", label: "Image caption", required: true },
    ] },
    { title: "Homepage sections", description: "Edit the headings and descriptions throughout the public homepage.", icon: LayoutTemplate, fields: [
      { name: "topicsTitle", label: "Topics section title", required: true },
      { name: "topicsDescription", label: "Topics description", multiline: true, required: true },
      { name: "featuredTitle", label: "Featured section title", required: true },
      { name: "featuredDescription", label: "Featured description", multiline: true, required: true },
      { name: "indexTitle", label: "A–Z directory title", multiline: true, required: true },
      { name: "indexDescription", label: "A–Z directory description", multiline: true, required: true },
      { name: "missionTitle", label: "Our mission title", multiline: true, required: true },
      { name: "missionDescription", label: "Our mission description", multiline: true, required: true },
    ] },
    { title: "Footer & reader information", description: "The closing message and health information notice shown to readers.", icon: Type, fields: [
      { name: "footerText", label: "Footer text", multiline: true, required: true },
      { name: "disclaimer", label: "Medical information notice", multiline: true, required: true },
    ] },
  ];

  return <form action={formAction} className="admin-settings-form"><div className="admin-settings-grid"><div>{groups.map((group) => <section className="admin-panel admin-form-panel" key={group.title}><div className="admin-section-label"><group.icon size={19} /><h2>{group.title}</h2></div><p className="admin-panel-description">{group.description}</p>{group.fields.map((field) => <div className="admin-field" key={field.name}><label htmlFor={`setting-${field.name}`}>{field.label}{field.required && <span> *</span>}</label>{field.multiline ? <textarea id={`setting-${field.name}`} name={field.name} rows={3} required={field.required} value={values[field.name]} onChange={(event) => setValues((previous) => ({ ...previous, [field.name]: event.target.value }))} maxLength={fieldLimits[field.name]} /> : <input id={`setting-${field.name}`} name={field.name} type={field.type || "text"} required={field.required} value={values[field.name]} onChange={(event) => setValues((previous) => ({ ...previous, [field.name]: event.target.value }))} maxLength={fieldLimits[field.name]} />}{field.hint && <small>{field.hint}</small>}</div>)}</section>)}</div><aside className="admin-editor-aside"><section className="admin-panel admin-form-panel admin-settings-save"><span className="admin-settings-icon"><Globe2 size={29} strokeWidth={1.5} /></span><h2>Make it your own</h2><p className="admin-panel-description">Your changes apply across the website as soon as you save.</p><FormFeedback state={state} /><button type="submit" className="admin-button admin-button-wide" disabled={pending}>{pending ? <LoaderCircle size={17} className="admin-spin" /> : <Save size={17} />}{pending ? "Saving…" : "Save settings"}</button></section></aside></div></form>;
}
