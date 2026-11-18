"use client";

import { useEffect, useId, useState } from "react";
import { headings, historyRefs, type HistoryRef } from "@/lib/content";

function kindLabel(kind: HistoryRef["kind"]): string {
  return kind === "freelance" ? "Freelance" : "Employment";
}

function hasDetail(
  item: HistoryRef,
): item is HistoryRef & { screenshot: string; description: string } {
  return Boolean(item.screenshot && item.description);
}

function HistoryPlate({
  item,
  tabIndex,
  selected,
  onSelect,
}: {
  item: HistoryRef;
  tabIndex?: number;
  selected: boolean;
  onSelect: (item: HistoryRef) => void;
}) {
  const mark = item.logo ? (
    <>
      <img className="history-logo" src={item.logo} alt="" />
      <span className="sr-only">{item.name}</span>
    </>
  ) : (
    <span className="history-wordmark">{item.name}</span>
  );

  const content = (
    <>
      <span className="history-kind">{kindLabel(item.kind)}</span>
      {mark}
      {item.note ? <span className="history-note">{item.note}</span> : null}
    </>
  );

  if (hasDetail(item)) {
    return (
      <button
        type="button"
        className={`history-plate${selected ? " is-active" : ""}`}
        tabIndex={tabIndex}
        aria-pressed={selected}
        aria-controls="history-detail"
        onClick={() => onSelect(item)}
      >
        {content}
      </button>
    );
  }

  if (item.external) {
    return (
      <a
        className="history-plate"
        href={item.href}
        target="_blank"
        rel="noreferrer"
        tabIndex={tabIndex}
      >
        {content}
      </a>
    );
  }

  return (
    <a className="history-plate" href={item.href} tabIndex={tabIndex}>
      {content}
    </a>
  );
}

export function HistoryBanner() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const titleId = useId();
  const active = historyRefs.find((item) => item.id === activeId) ?? null;
  const detail = active && hasDetail(active) ? active : null;

  useEffect(() => {
    if (!detail) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveId(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detail]);

  function onSelect(item: HistoryRef) {
    setActiveId((current) => (current === item.id ? null : item.id));
  }

  return (
    <section className="history-banner" id="history" aria-labelledby="history-heading" data-history>
      <div className="history-banner-inner">
        <div className="history-banner-head">
          <p className="index-no">Ref</p>
          <h2 id="history-heading">{headings.history}</h2>
        </div>
      </div>

      <div className="history-rail" data-lenis-prevent-horizontal="">
        <ul className="history-static">
          {historyRefs.map((item) => (
            <li key={item.id}>
              <HistoryPlate
                item={item}
                selected={activeId === item.id}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>

        <div className="history-marquee">
          <ul className="history-track">
            {historyRefs.map((item) => (
              <li key={item.id}>
                <HistoryPlate
                  item={item}
                  selected={activeId === item.id}
                  onSelect={onSelect}
                />
              </li>
            ))}
            {historyRefs.map((item) => (
              <li key={`${item.id}-loop`} aria-hidden="true">
                <HistoryPlate
                  item={item}
                  tabIndex={-1}
                  selected={activeId === item.id}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {historyRefs.filter(hasDetail).map((item) => {
        const open = activeId === item.id;
        return (
          <div
            key={`detail-${item.id}`}
            className="history-detail"
            id={open ? "history-detail" : undefined}
            role="region"
            aria-labelledby={`${titleId}-${item.id}`}
            hidden={!open}
          >
            <div className="history-detail-inner">
              <figure className="history-detail-media">
                <img
                  src={item.screenshot}
                  alt={`${item.name} system screenshot`}
                />
              </figure>

              <div className="history-detail-copy">
                <p className="history-kind">{kindLabel(item.kind)}</p>
                <h3 id={`${titleId}-${item.id}`}>{item.name}</h3>
                <p>{item.description}</p>

                <div className="history-detail-actions">
                  {item.external ? (
                    <a
                      className="history-detail-cta"
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit site
                    </a>
                  ) : item.href.startsWith("#") ? (
                    <a className="history-detail-cta" href={item.href}>
                      View employment
                    </a>
                  ) : null}

                  <button
                    type="button"
                    className="history-detail-close"
                    onClick={() => setActiveId(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
