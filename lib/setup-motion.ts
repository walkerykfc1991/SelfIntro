import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { allowSmoothScroll, prefersReducedMotion } from "@/lib/env";

gsap.registerPlugin(ScrollTrigger);

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function setupMotion(): () => void {
  const cleanups: Array<() => void> = [];
  const add = (fn: () => void) => {
    cleanups.push(fn);
  };

  const header = document.querySelector<HTMLElement>("[data-header]");
  const progress = document.querySelector<HTMLElement>("[data-page-progress]");
  const career = document.querySelector<HTMLElement>("[data-career]");
  const careerBar = document.querySelector<HTMLElement>("[data-career-bar]");

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const amount = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
    if (progress) progress.style.transform = `scaleX(${amount})`;
    if (career && careerBar) {
      const rect = career.getBoundingClientRect();
      const total = Math.max(career.offsetHeight - window.innerHeight * 0.45, 1);
      const passed = Math.min(Math.max(-rect.top + window.innerHeight * 0.2, 0), total);
      careerBar.style.transform = `scaleY(${passed / total})`;
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  add(() => window.removeEventListener("scroll", onScroll));

  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-nav]"));
  const sections = navLinks
    .map((link) => document.getElementById(link.dataset.nav ?? ""))
    .filter((section): section is HTMLElement => section instanceof HTMLElement);
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = new Map<string, number>();
      for (const entry of entries) {
        visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      let best = "";
      let bestRatio = 0;
      for (const [id, ratio] of visible) {
        if (ratio > bestRatio) {
          best = id;
          bestRatio = ratio;
        }
      }
      if (!entries.some((entry) => entry.isIntersecting) && bestRatio === 0) return;
      for (const link of navLinks) {
        link.setAttribute("aria-current", link.dataset.nav === best ? "true" : "false");
      }
    },
    { threshold: [0.15, 0.35, 0.55, 0.75] },
  );
  for (const section of sections) navObserver.observe(section);
  add(() => navObserver.disconnect());

  const roleLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-career-link]"));
  const roles = Array.from(document.querySelectorAll<HTMLElement>("[data-role]"));
  const roleObserver = new IntersectionObserver(
    (entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      const id = active.target.id;
      for (const role of roles) role.classList.toggle("is-active", role.id === id);
      for (const link of roleLinks) {
        link.setAttribute("aria-current", link.getAttribute("href") === `#${id}` ? "true" : "false");
      }
    },
    { rootMargin: "-42% 0px -48% 0px", threshold: [0, 0.15, 0.4] },
  );
  for (const role of roles) roleObserver.observe(role);
  add(() => roleObserver.disconnect());

  let lenis: Lenis | null = null;
  if (allowSmoothScroll()) {
    lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      syncTouch: false,
      autoRaf: false,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const ticker = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
    add(() => {
      gsap.ticker.remove(ticker);
      lenis?.destroy();
    });
  }

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const node = event.target instanceof Element ? event.target.closest("a[href^='#']") : null;
    if (!(node instanceof HTMLAnchorElement)) return;
    const hash = node.getAttribute("href");
    if (!hash || hash === "#") return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return;
    event.preventDefault();
    if (lenis && !prefersReducedMotion()) {
      lenis.scrollTo(el, { offset: -76, duration: 1.15 });
    } else {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
    history.pushState(null, "", hash);
  };
  document.addEventListener("click", onClick);
  add(() => document.removeEventListener("click", onClick));

  const mm = gsap.matchMedia();
  add(() => mm.revert());

  mm.add("(min-width: 880px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)", () => {
    const root = document.documentElement;
    const summary = document.querySelector<HTMLElement>("[data-summary]");
    const lines = Array.from(document.querySelectorAll<HTMLElement>("[data-summary-line]"));
    const counter = document.querySelector<HTMLElement>("[data-summary-count]");
    const bar = document.querySelector<HTMLElement>("[data-summary-bar]");
    if (!summary || lines.length === 0) return;
    root.classList.add("is-sequenced");

    const render = (progress: number) => {
      const scaled = progress * (lines.length - 1);
      const index = Math.min(lines.length - 1, Math.floor(scaled + 1e-6));
      const local = scaled - index;
      lines.forEach((line, lineIndex) => {
        let opacity = 0;
        let y = 28;
        if (lineIndex === index) {
          if (index === lines.length - 1 || local < 0.68) {
            opacity = 1;
            y = 0;
          } else if (local < 0.84) {
            const t = (local - 0.68) / 0.16;
            opacity = 1 - t;
            y = -18 * t;
          }
        } else if (lineIndex === index + 1 && local >= 0.86) {
          const t = Math.min(1, (local - 0.86) / 0.14);
          opacity = t;
          y = 22 * (1 - t);
        }
        line.style.opacity = opacity.toFixed(3);
        line.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      });
      const shown = index < lines.length - 1 && local >= 0.86 ? index + 2 : index + 1;
      if (counter) counter.textContent = pad(shown);
      if (bar) bar.style.transform = `scaleX(${progress})`;
    };

    render(0);
    const trigger = ScrollTrigger.create({
      trigger: summary,
      start: "top top",
      end: "+=165%",
      pin: true,
      scrub: 0.65,
      anticipatePin: 1,
      onUpdate: (self) => render(self.progress),
    });

    return () => {
      trigger.kill();
      root.classList.remove("is-sequenced");
      for (const line of lines) {
        line.style.opacity = "";
        line.style.transform = "";
      }
    };
  });

  mm.add("(min-width: 880px) and (prefers-reduced-motion: no-preference)", () => {
    const title = document.querySelector<HTMLElement>("[data-hero-title]");
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (!title || !hero) return;
    const tween = gsap.to(title, {
      y: -72,
      opacity: 0.2,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  });

  const onMedia = () => ScrollTrigger.refresh();
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", onMedia);
  add(() => motionQuery.removeEventListener("change", onMedia));
  ScrollTrigger.refresh();

  return () => {
    for (const cleanup of cleanups.reverse()) cleanup();
  };
}
