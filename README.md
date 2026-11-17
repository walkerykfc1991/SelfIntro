# Walker Yip — personal introduction

A single-page introduction for Walker Yip, taken from the approved CV. It is a personal introduction only. It is not a job board and it does not take work requests.

The page is a static Next.js export: scroll-sequenced typography, a pointer-reactive WebGL field, and a skills instrument. The employment history, summary, and skills are the existing English CV text.

## Preview locally

Install dependencies, then start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000/SelfIntro/

The `/SelfIntro` prefix matches the GitHub Pages project URL, so asset paths are the same locally and in production.

To preview the static export the way Pages serves it:

```bash
npm run build
npm run preview
```

Open http://localhost:4173/SelfIntro/

`npm run build` writes the export to `out/` and checks that the professional copy is intact and that no phone number is rendered. `npm run sync` copies that export to the repository root, which is what GitHub Pages publishes.

## GitHub Pages

Pages is already enabled for this repository. It publishes the **root of the `main` branch** (`source.branch: main`, `source.path: /`) with the built-in pages deployment. The public URL stays:

https://walkerykfc1991.github.io/SelfIntro/

A pull request cannot change that Pages source setting. So the static export is committed beside the Next.js source:

- `index.html` and the rest of the export at the repository root
- `_next/` for the compiled CSS, JavaScript, and fonts
- `.nojekyll` so Pages does not hide `_next`
- `.pages-export.json` lists the generated files so the next sync can replace them

After this merges to `main`, the existing Pages pipeline publishes those files. No settings change is required.

When the page changes, regenerate and commit the export:

```bash
npm run build
npm run sync
```

The build workflow (`.github/workflows/pages.yml`) runs `npm ci`, `npm run build`, and `npm run sync`, then fails if the committed export does not match. That keeps the files Pages serves aligned with the source.

## Stack

Next.js 15, React 19, TypeScript 5, and Tailwind CSS 4. Motion uses GSAP ScrollTrigger and Lenis. The background is a small WebGL contour field, not a 3D scene.

## Reduced motion and small screens

If the visitor prefers reduced motion, Lenis, the custom cursor, the pinned summary, and the animated field stay off. The summary, employment history, and skills remain in normal document order.

The pinned summary runs on a fine pointer at a large viewport. Touch and narrow screens keep native scrolling and a stacked layout. The WebGL field drops its frame rate on small screens and freezes if a frame budget is missed or data-saver is on. If WebGL is unavailable, the CSS background remains.

## Content rules

Visible copy follows the CV. Do not add employers, tools, dates, or metrics. Do not display a phone number. The WhatsApp link keeps its existing `wa.me` href and the visible label `WhatsApp`. Email is walkerykfc@gmail.com. LinkedIn is https://www.linkedin.com/in/walker-yip-147008264/. The current employer is written MediFast. Do not append another word to that name.
