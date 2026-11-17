"use client";

import { useEffect, useRef } from "react";
import { mountStudio } from "@/lib/studio";

export function Atmosphere() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return mountStudio(canvas);
  }, []);

  return <canvas ref={ref} className="atmosphere" aria-hidden="true" />;
}
