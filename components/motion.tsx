"use client";

import { useEffect } from "react";
import "lenis/dist/lenis.css";

export function Motion() {
  useEffect(() => {
    let cleanup = () => {};
    let alive = true;
    import("@/lib/setup-motion").then(({ setupMotion }) => {
      if (!alive) return;
      cleanup = setupMotion();
    });
    return () => {
      alive = false;
      cleanup();
    };
  }, []);

  return null;
}
