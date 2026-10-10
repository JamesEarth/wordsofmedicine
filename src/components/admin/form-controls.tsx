"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, LoaderCircle, LogOut, TriangleAlert } from "lucide-react";
import type { ActionState } from "@/lib/admin-actions";

export function FormFeedback({ state }: { state: ActionState }) {
  if (!state.error && !state.success) return null;
  return <div className={`admin-feedback ${state.error ? "admin-feedback-error" : "admin-feedback-success"}`} role={state.error ? "alert" : "status"}>{state.error ? <TriangleAlert size={18} /> : <CheckCircle2 size={18} />}<span>{state.error || state.success}</span></div>;
}

export function LogoutButton() {
  const { pending } = useFormStatus();
  return <button type="submit" className="admin-icon-button" title="Sign out" aria-label="Sign out" disabled={pending}>{pending ? <LoaderCircle size={18} className="admin-spin" /> : <LogOut size={18} />}</button>;
}
