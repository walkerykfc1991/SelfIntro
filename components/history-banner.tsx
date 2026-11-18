import { headings, historyRefs, type HistoryRef } from "@/lib/content";

function kindLabel(kind: HistoryRef["kind"]): string {
  return kind === "freelance" ? "Freelance" : "Employment";
}

function HistoryPlate({
  item,
  tabIndex,
}: {
  item: HistoryRef;
  tabIndex?: number;
}) {
  const mark = item.logo ? (
    <img className="history-logo" src={item.logo} alt={item.name} />
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
              <HistoryPlate item={item} />
            </li>
          ))}
        </ul>

        <div className="history-marquee">
          <ul className="history-track">
            {historyRefs.map((item) => (
              <li key={item.id}>
                <HistoryPlate item={item} />
              </li>
            ))}
            {historyRefs.map((item) => (
              <li key={`${item.id}-loop`} aria-hidden="true">
                <HistoryPlate item={item} tabIndex={-1} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
