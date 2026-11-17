"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { headings, skills } from "@/lib/content";
import { prefersFinePointer, prefersReducedMotion } from "@/lib/env";
import { fallbackWave, waves } from "@/lib/waves";

function indexLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function Skills() {
  const [active, setActive] = useState(skills[0].id);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("is-enhanced");
    return () => root.classList.remove("is-enhanced");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const coarse = !prefersFinePointer();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let visible = true;
    let pointer = 0.5;
    let time = 0;
    const current = { amps: [0.4, 0.2, 0.08], speed: 0.014, harmonics: [2, 4, 8] };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width < 2 || height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    };

    const draw = () => {
      if (width < 2 || height < 2) return;
      const skill = skills.find((item) => item.id === activeRef.current);
      const target = waves[skill?.id ?? ""] ?? fallbackWave;
      current.harmonics = [...target.harmonics];
      current.speed += (target.speed - current.speed) * (reduced ? 1 : 0.08);
      for (let i = 0; i < 3; i += 1) {
        const next = target.amps[i] ?? 0;
        current.amps[i] += (next - (current.amps[i] ?? 0)) * (reduced ? 1 : 0.08);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(239, 236, 228, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i += 1) {
        const y = (height / 4) * i + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let i = 1; i < 8; i += 1) {
        const x = (width / 8) * i + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const mid = height * 0.5;
      const trace = (phase: number, alpha: string, widthPx: number) => {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const u = x / width;
          let y = 0;
          for (let i = 0; i < 3; i += 1) {
            const harmonic = current.harmonics[i] ?? 1;
            const amp = current.amps[i] ?? 0;
            y += Math.sin(u * Math.PI * 2 * harmonic + time * current.speed * harmonic + pointer * harmonic + phase) * amp;
          }
          const py = mid + y * height * 0.32;
          if (x === 0) ctx.moveTo(0, py);
          else ctx.lineTo(x, py);
        }
        ctx.strokeStyle = alpha;
        ctx.lineWidth = widthPx;
        ctx.stroke();
      };

      trace(0.6, "rgba(239, 236, 228, 0.28)", 1);
      trace(0, "#e6ff4d", 1.6);

      if (!reduced) {
        const sx = (time * 0.004) % 1 * width;
        const glow = ctx.createLinearGradient(sx - 18, 0, sx + 18, 0);
        glow.addColorStop(0, "rgba(230, 255, 77, 0)");
        glow.addColorStop(0.5, "rgba(230, 255, 77, 0.45)");
        glow.addColorStop(1, "rgba(230, 255, 77, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(sx - 18, 0, 36, height);
      }
    };

    const loop = () => {
      if (!running) return;
      if (visible) {
        time += coarse ? 16 : 11;
        draw();
      }
      raf = window.requestAnimationFrame(loop);
    };

    const onPointer = (event: PointerEvent) => {
      if (width < 2) return;
      const rect = canvas.getBoundingClientRect();
      pointer = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      if (reduced) draw();
    };

    resize();
    draw();
    const observer = new ResizeObserver(() => {
      resize();
      draw();
    });
    observer.observe(canvas);
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible && reduced) draw();
      },
      { threshold: 0.05 },
    );
    visibility.observe(root);
    canvas.addEventListener("pointermove", onPointer);
    if (!reduced) raf = window.requestAnimationFrame(loop);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      canvas.removeEventListener("pointermove", onPointer);
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = skills.findIndex((skill) => skill.id === active);
    let next = current;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (current + 1) % skills.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (current - 1 + skills.length) % skills.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = skills.length - 1;
    else return;
    event.preventDefault();
    const id = skills[next].id;
    setActive(id);
    window.requestAnimationFrame(() => {
      document.getElementById(`tab-${id}`)?.focus();
    });
  };

  const activeIndex = Math.max(0, skills.findIndex((skill) => skill.id === active));

  return (
    <section className="section skills" id="skills" aria-labelledby="skills-heading" ref={rootRef}>
      <div className="skills-head">
        <p className="index-no">03</p>
        <h2 id="skills-heading">{headings.skills}</h2>
        <svg className="dial" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="6" />
          {skills.map((skill, index) => {
            const angle = (index / skills.length) * Math.PI * 2 - Math.PI / 2;
            const inner = index === activeIndex ? 34 : 40;
            const outer = index === activeIndex ? 54 : 48;
            return (
              <line
                key={skill.id}
                x1={60 + Math.cos(angle) * inner}
                y1={60 + Math.sin(angle) * inner}
                x2={60 + Math.cos(angle) * outer}
                y2={60 + Math.sin(angle) * outer}
                className={index === activeIndex ? "is-active" : undefined}
              />
            );
          })}
          <line
            className="needle"
            x1="60"
            y1="60"
            x2="60"
            y2="18"
            transform={`rotate(${activeIndex * (360 / skills.length)} 60 60)`}
          />
        </svg>
      </div>

      <div className="skills-layout">
        <div className="skill-tabs" role="tablist" aria-orientation="vertical" aria-label="Skills">
          {skills.map((skill, index) => {
            const selected = skill.id === active;
            return (
              <button
                key={skill.id}
                id={`tab-${skill.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${skill.id}`}
                tabIndex={selected ? 0 : -1}
                className={selected ? "is-active" : undefined}
                onClick={() => setActive(skill.id)}
                onKeyDown={onKeyDown}
              >
                <span className="skill-no">{indexLabel(index)}</span>
                <span>{skill.name}</span>
              </button>
            );
          })}
        </div>

        <div className="skill-readout">
          <div className="scope">
            <canvas ref={canvasRef} aria-hidden="true" />
          </div>
          {skills.map((skill) => {
            const selected = skill.id === active;
            return (
              <div
                key={skill.id}
                id={`panel-${skill.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${skill.id}`}
                className={selected ? "skill-panel is-active" : "skill-panel"}
              >
                <h3>{skill.name}</h3>
                {skill.marks.length > 0 ? (
                  <ul className="marks">
                    {skill.marks.map((mark) => (
                      <li key={mark}>{mark}</li>
                    ))}
                  </ul>
                ) : null}
                <p>{skill.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
