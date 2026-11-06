"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/actions/auth";

type Props = { action: (state: AuthState, formData: FormData) => Promise<AuthState>; mode: "login" | "signup" };

export function AuthForm({ action, mode }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="auth-form">
    {mode === "signup" && <>
      <label>Full name<input name="fullName" autoComplete="name" placeholder="Your full name" required /></label>
      <label>Business or workspace name<input name="organizationName" placeholder="e.g. Crownzcom Property Management" required /></label>
    </>}
    <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
    <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder="At least 8 characters" required /></label>
    {state.error && <p className="error-message" role="alert">{state.error}</p>}
    <button className="auth-submit" disabled={pending}>{pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create workspace"}</button>
  </form>;
}
