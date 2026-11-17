"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { headings, skills } from "@/lib/content";

function indexLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function Skills() {
  const [active, setActive] = useState(skills[0].id);
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("is-enhanced");
    return () => root.classList.remove("is-enhanced");
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
