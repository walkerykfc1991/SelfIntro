# Walker Yip — personal introduction

A single-page introduction for Walker Yip, taken from the approved CV. It is a personal introduction only. It is not a job board and it does not take work requests.

The page is a static Next.js export: scroll-sequenced typography, a pointer-reactive cubic wave, and a procedurally modelled metal still life in the hero. The employment history, summary, and skills are the existing English CV text.

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

The build workflow (`.github/workflows/pages.yml`) runs the production build, then checks that the committed `index.html` carries the same source stamp as the current source. Webpack chunk names are not compared, because those hashes differ between machines. Pages still serves the committed export, so run `npm run sync` and commit it after a build.

## Stack

Next.js 15, React 19, TypeScript 5, and Tailwind CSS 4. Motion uses GSAP ScrollTrigger and Lenis. The background is an instanced array of cubes generated in code. Their heights follow a traveling wave; the pointer swells and ripples nearby columns, and scroll shifts the wave's phase. The hero adds an original still life — a bent plate, three fins, a rod, and a ring — shaded with custom metal lighting. No external model or texture is used.

## Reduced motion and small screens

If the visitor prefers reduced motion, Lenis, the custom cursor, the pinned summary, and the animated field stay off. The summary, employment history, and skills remain in normal document order.

The pinned summary runs on a fine pointer at a large viewport. Touch and narrow screens keep native scrolling and a stacked layout. The cubic wave and the hero still life drop their frame rate on coarse pointers and freeze to a still frame if a frame budget is missed, the renderer is software, or data-saver is on. Reduced motion keeps that still frame and skips the animated camera. A pointer can still raise nearby cubes in the still, without the traveling wave. If WebGL is unavailable, the CSS background remains. The still life fades out through the summary so the employment history stays typographic.

## Content rules

Visible copy follows the CV for employment, summary, and skills. Do not add employers, tools, dates, or metrics beyond that CV text. The horizontal History banner may also list approved freelance web references and CV project wordmarks until a logo asset is assigned (`logo` on `historyRefs`). Slides with `screenshot` and `description` open an appended detail panel under the banner; other employer plates keep hash navigation to the role. Grand Hill Wines (`https://grandhillwines.com`) is the current freelance web reference. Clinic CRM is the current employment project reference (MediFast logo and CV migration copy) and links through to the MediFast role. Do not display a phone number. The WhatsApp link keeps its existing `wa.me` href and the visible label `WhatsApp`. Email is walkerykfc@gmail.com. LinkedIn is https://www.linkedin.com/in/walker-yip-147008264/. The current employer is written MediFast. Do not append another word to that name.
