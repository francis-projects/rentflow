"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = {
  code: string;
  name: string;
  monthly_price_minor: number | null;
  annual_price_minor: number | null;
};

const formatUsd = (minor: number | null) => minor === null
  ? "Custom"
  : minor === 0
    ? "$0"
    : "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(minor / 100);

const descriptions: Record<string, string> = {
  free: "A clear starting point for a small rental portfolio.",
  starter: "The essentials to run a growing rental business with confidence.",
  professional: "More capacity, deeper oversight and tools for a busy team.",
  enterprise: "Flexible support for complex portfolios and operations.",
};

const highlights: Record<string, string[]> = {
  free: ["1 property · 5 units", "Rent ledger and tenant records", "Core maintenance tracking"],
  starter: ["Up to 5 properties · 30 units", "Tenant documents and owner statements", "Team access and rent reminders"],
  professional: ["Up to 25 properties · 200 units", "AI portfolio insights and exports", "Up to 10 team members"],
  enterprise: ["Flexible property and unit limits", "Advanced portfolio workflows", "Priority support and tailored onboarding"],
};

export function PricingSection({ plans }: { plans: Plan[] }) {
  const [interval, setInterval] = useState<"monthly" | "annual">("annual");
  const ordered = ["free", "starter", "professional", "enterprise"]
    .map((code) => plans.find((plan) => plan.code === code))
    .filter((plan): plan is Plan => Boolean(plan));

  return (
    <section className="landing-pricing" id="plans">
      <div className="pricing-heading">
        <div>
          <p className="landing-kicker">SIMPLE, TRANSPARENT PRICING</p>
          <h2>Room to grow.<br /><em>Clarity at every step.</em></h2>
          <p>Choose the rhythm that works for your business. Switch plans as your portfolio grows.</p>
        </div>
        <div className="billing-switch-wrap">
          <div className="billing-switch" role="group" aria-label="Choose billing interval">
            <button type="button" aria-pressed={interval === "monthly"} className={interval === "monthly" ? "is-active" : ""} onClick={() => setInterval("monthly")}>Monthly</button>
            <button type="button" aria-pressed={interval === "annual"} className={interval === "annual" ? "is-active" : ""} onClick={() => setInterval("annual")}>Annual <span>Discount</span></button>
          </div>
          <small>All prices in USD · Annual plans are billed yearly</small>
        </div>
      </div>
      <div className="pricing-grid">
        {ordered.map((plan) => {
          const price = interval === "annual" ? plan.annual_price_minor : plan.monthly_price_minor;
          const custom = plan.code === "enterprise" || price === null;
          const monthlyEquivalent = interval === "annual" && price !== null && price > 0 ? price / 12 : null;
          const saving = plan.monthly_price_minor !== null && plan.annual_price_minor !== null
            ? plan.monthly_price_minor * 12 - plan.annual_price_minor : 0;
          const discountPercent = plan.monthly_price_minor !== null && plan.monthly_price_minor > 0
            && plan.annual_price_minor !== null && saving > 0
            ? Math.round((saving / (plan.monthly_price_minor * 12)) * 100) : 0;
          return (
            <article className={`pricing-card ${plan.code === "professional" ? "pricing-card-featured" : ""}`} key={plan.code}>
              {plan.code === "professional" && <span className="pricing-popular">MOST POPULAR</span>}
              <div className="pricing-card-title"><span>{plan.name}</span><span className="pricing-plan-mark">{plan.code === "enterprise" ? "↗" : plan.code === "free" ? "○" : "✳"}</span></div>
              <p>{descriptions[plan.code] ?? "A flexible plan for your rental business."}</p>
              <div className="pricing-amount" aria-live="polite" aria-atomic="true">
                <strong>{custom ? "Let's talk" : formatUsd(price)}</strong>
                {!custom && <span>/{interval === "annual" ? "year" : "month"}</span>}
              </div>
              {monthlyEquivalent !== null && <small className="pricing-equivalent">{formatUsd(Math.round(monthlyEquivalent))} per month, billed annually</small>}
              {interval === "annual" && saving > 0 && <small className="pricing-saving">You save {formatUsd(saving)} each year ({discountPercent}% off)</small>}
              <Link className={plan.code === "professional" ? "pricing-cta pricing-cta-solid" : "pricing-cta"} href="/signup">
                {plan.code === "free" ? "Get started free" : plan.code === "enterprise" ? "Talk to our team" : "Choose " + plan.name}
                <span aria-hidden="true">↗</span>
              </Link>
              <div className="pricing-divider" />
              <strong className="pricing-includes">What’s included</strong>
              <ul>{(highlights[plan.code] ?? []).map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
            </article>
          );
        })}
      </div>
      <p className="pricing-footnote">No online payment is taken yet. Selecting a plan starts a workspace setup or plan request; billing activation will be introduced separately.</p>
    </section>
  );
}
