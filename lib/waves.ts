/**
 * Decorative oscillator recipes for the skills instrument.
 * These numbers are not measurements and are never rendered as text.
 */
export type Wave = {
  harmonics: readonly number[];
  amps: readonly number[];
  speed: number;
};

export const waves: Record<string, Wave> = {
  react: { harmonics: [2, 5, 9], amps: [0.56, 0.22, 0.08], speed: 0.017 },
  node: { harmonics: [1, 3, 8], amps: [0.5, 0.28, 0.07], speed: 0.014 },
  database: { harmonics: [3, 6, 10], amps: [0.42, 0.2, 0.1], speed: 0.011 },
  docker: { harmonics: [2, 4, 12], amps: [0.34, 0.3, 0.06], speed: 0.02 },
  deploy: { harmonics: [1, 2, 6], amps: [0.48, 0.16, 0.12], speed: 0.01 },
  csharp: { harmonics: [4, 7, 11], amps: [0.4, 0.22, 0.07], speed: 0.015 },
  go: { harmonics: [1, 5, 13], amps: [0.62, 0.1, 0.05], speed: 0.022 },
  python: { harmonics: [2, 3, 7], amps: [0.36, 0.3, 0.12], speed: 0.013 },
};

export const fallbackWave: Wave = {
  harmonics: [2, 4, 8],
  amps: [0.45, 0.2, 0.08],
  speed: 0.014,
};
