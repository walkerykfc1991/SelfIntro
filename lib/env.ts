export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function prefersFinePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function allowSmoothScroll(): boolean {
  if (prefersReducedMotion()) return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  return !(coarse && !fine);
}
