"use client";

import { useEffect, useRef } from "react";

export function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add("is-visible");
        observer.unobserve(node);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`scroll-reveal ${className}`}>{children}</div>;
}
