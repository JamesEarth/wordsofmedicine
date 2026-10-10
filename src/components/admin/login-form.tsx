"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { loginAction } from "@/lib/admin-actions";
import { FormFeedback } from "@/components/admin/form-controls";

export function RefreshLoginButton() {
  const router = useRouter();
  return <button type="button" className="admin-button admin-button-wide" onClick={() => router.refresh()}>Continue to sign in<ArrowRight size={16} /></button>;
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return <form action={formAction} className="admin-login-form"><div className="admin-field"><label htmlFor="admin-email">Email address</label><input id="admin-email" name="email" type="email" autoComplete="username" placeholder="you@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="admin-field"><label htmlFor="admin-password">Password</label><div className="admin-password-input"><input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div><FormFeedback state={state} /><button type="submit" disabled={pending} className="admin-button admin-button-wide">{pending ? <><LoaderCircle size={18} className="admin-spin" />Signing in…</> : <>Sign in to your studio<ArrowRight size={18} /></>}</button><p className="admin-login-help">Access is reserved for your website’s administrator.</p></form>;
}
