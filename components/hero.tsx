import { ContactLinks } from "@/components/contact";
import { role } from "@/lib/content";

export function Hero() {
  return (
    <header className="hero" id="top" data-hero>
      <div className="hero-copy">
        <p className="kicker hero-rise">
          <span className="mark" aria-hidden="true" />
          {role}
        </p>
        <div className="hero-rise">
          <h1 className="hero-title" data-hero-title>
            <span>Walker</span>
            <span>Yip</span>
          </h1>
        </div>
        <ContactLinks className="hero-rise" />
      </div>
      <a className="scroll-cue" href="#summary">
        <span>Scroll</span>
        <span className="scroll-cue-line" aria-hidden="true" />
      </a>
    </header>
  );
}
