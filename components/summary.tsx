import { headings, summary } from "@/lib/content";

export function Summary() {
  return (
    <section className="section summary" id="summary" aria-labelledby="summary-heading" data-summary>
      <div className="summary-pin">
        <div className="summary-meta">
          <p className="index-no">01</p>
          <h2 id="summary-heading">{headings.summary}</h2>
          <p className="summary-count" aria-hidden="true">
            <span data-summary-count="">01</span>
            <span> / 03</span>
          </p>
        </div>
        <div className="summary-stage" data-summary-stage>
          {summary.map((sentence) => (
            <p key={sentence} className="summary-line" data-summary-line="">
              {sentence}
            </p>
          ))}
        </div>
        <div className="summary-rule" aria-hidden="true">
          <span data-summary-bar="" />
        </div>
      </div>
    </section>
  );
}
