"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Svara`;
  }, [title]);
}

/** Client-side navigation resets nothing, so move focus to the new view's h1. */
export function useRouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => document.getElementById("page-title")?.focus({ preventScroll: false }), 0);
    return () => clearTimeout(t);
  }, [pathname]);
}
