import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string; error?: string }> }) {
  const params = await searchParams;
  return <main className="auth-shell">
    <section className="auth-card">
      <Link href="/" className="auth-brand"><span className="brand-mark">R</span> rentflow</Link>
      <p className="eyebrow">WELCOME BACK</p>
      <h1>Sign in to your workspace</h1>
      <p className="auth-subtitle">Manage properties, tenants and rent collection from one place.</p>
      {params.registered && <p className="success-message">Account created. Check your email to confirm your address, then sign in.</p>}
      {params.error && <p className="error-message">Your confirmation link could not be verified. Please try signing in or request a new confirmation email.</p>}
      <AuthForm action={signIn} mode="login" />
      <p className="auth-switch">New to RentFlow? <Link href="/signup">Create an account</Link></p>
    </section>
    <p className="auth-footnote">Secure rental operations for growing property businesses.</p>
  </main>;
}
