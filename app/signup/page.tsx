import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return <main className="auth-shell">
    <section className="auth-card">
      <Link href="/" className="auth-brand"><span className="brand-mark">R</span> rentflow</Link>
      <p className="eyebrow">GET STARTED</p>
      <h1>Create your workspace</h1>
      <p className="auth-subtitle">Start organising your properties, tenants and rental income.</p>
      <AuthForm action={signUp} mode="signup" />
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </section>
    <p className="auth-footnote">Your rental portfolio, organised.</p>
  </main>;
}
