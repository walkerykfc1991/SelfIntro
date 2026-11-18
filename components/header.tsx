import { name } from "@/lib/content";

const links = [
  { href: "#summary", id: "summary", label: "Summary" },
  { href: "#history", id: "history", label: "History" },
  { href: "#employment", id: "employment", label: "Employment" },
  { href: "#skills", id: "skills", label: "Skills" },
];

export function Header() {
  return (
    <header className="site-header" data-header>
      <div className="header-progress" aria-hidden="true">
        <span data-page-progress="" />
      </div>
      <div className="header-inner">
        <a className="brand" href="#top">
          {name}
        </a>
        <nav className="site-nav" aria-label="On this page">
          {links.map((link) => (
            <a key={link.id} href={link.href} data-nav={link.id}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
