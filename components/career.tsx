import { headings, roles } from "@/lib/content";

function indexLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function Career() {
  return (
    <section className="section career" id="employment" aria-labelledby="employment-heading" data-career>
      <div className="career-grid">
        <div className="career-index">
          <p className="index-no">02</p>
          <h2 id="employment-heading">{headings.employment}</h2>
          <nav aria-label="Employment history">
            <ol className="career-links">
              {roles.map((role, index) => (
                <li key={role.id}>
                  <a href={`#role-${role.id}`} data-career-link="">
                    <span className="career-link-no">{indexLabel(index)}</span>
                    <span className="career-link-copy">
                      <span className="career-link-company">{role.company}</span>
                      <span className="career-link-dates">{role.dates}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="career-meter" aria-hidden="true">
            <span data-career-bar="" />
          </div>
        </div>

        <div className="career-roles">
          {roles.map((role, index) => (
            <article key={role.id} className="role" id={`role-${role.id}`} data-role="">
              <p className="role-ghost" aria-hidden="true">
                {indexLabel(index)}
              </p>
              <h3>{role.company}</h3>
              <p className="role-meta">
                <span className="role-title">{role.title}</span>
                <span className="role-dates">{role.dates}</span>
              </p>
              {role.sections ? (
                role.sections.map((section) => (
                  <div key={section.heading} className="role-block">
                    <h4>{section.heading}</h4>
                    <p>{section.text}</p>
                  </div>
                ))
              ) : (
                <ul>
                  {role.items?.map((item) => (
                    <li key={item.label ?? item.text}>
                      {item.label ? (
                        <>
                          <strong>{item.label}</strong>{" "}
                        </>
                      ) : null}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
