export const name = "Walker Yip";
export const role = "Analyst Programmer";
export const documentTitle = "Walker Yip \u2014 Analyst Programmer";

export const summary = [
  "Analyst Programmer with 13 years\u2019 experience delivering web systems and integrating legacy platforms into new applications.",
  "Currently leading the migration of a clinic system from ASP.NET/C# to a Node.js and React CRM, including APIs, SQL migrations, and production deployment with Docker on Linux.",
  "Earlier work includes RPA, Oracle FCCS on Linux, and traffic and monitoring systems.",
] as const;

export const summaryText = summary.join(" ");

export const contact = {
  email: "walkerykfc@gmail.com",
  linkedin: "https://www.linkedin.com/in/walker-yip-147008264/",
  whatsappHref: "https://wa.me/85254635238",
  whatsappLabel: "WhatsApp",
} as const;

export type WorkSection = { heading: string; text: string };
export type WorkItem = { label?: string; text: string };

export type Role = {
  id: string;
  company: string;
  title: string;
  dates: string;
  sections?: readonly WorkSection[];
  items?: readonly WorkItem[];
};

export const roles: readonly Role[] = [
  {
    id: "medifast",
    company: "MediFast",
    title: "Analyst Programmer",
    dates: "Feb 2026 \u2013 Present",
    sections: [
      {
        heading: "Clinic CRM Migration",
        text: "Led the integration of a legacy ASP.NET/C# clinic system into a new Node.js/React CRM, re-implementing core operations so day-to-day clinic work could move off the old platform with feature parity.",
      },
      {
        heading: "System Integration (C# / ASP.NET to Node.js / React)",
        text: "Analysed existing clinic workflows, data structures, and business rules, then rebuilt them as Node.js services and React interfaces \u2014 including create/view booking, search pickers, overseas pre-insurance presets, in-clinic operations boards, report centre, and medical-form integration with the external client-facing app.",
      },
      {
        heading: "Data and Process Continuity",
        text: "Implemented SQL migrations and cross-system mappings so bookings, in-clinic records, reports, and medical-form sessions stay consistent between the legacy system and the new CRM. Also delivered production support such as monthly backup and restore for the outbound call list.",
      },
    ],
  },
  {
    id: "elufa",
    company: "Elufa Systems Ltd",
    title: "Analyst Programmer",
    dates: "Aug 2023 \u2013 Sep 2025",
    items: [
      {
        label: "RPA System (Towngas):",
        text: "Developed a robotic process automation solution for Tagetik monthly reports, replacing manual procedures. Built the full programme, including scheduled extraction and email forwarding to clients.",
      },
      {
        label: "Oracle Financial Consolidation and Close Service (MTR):",
        text: "Designed and implemented end-to-end financial consolidation and close processes using Oracle FCCS, aligned with IFRS, GAAP, and other regulatory standards. Managed the EPM Agent for Oracle FCCS on high-availability Linux server clusters, including data integration and process automation, to keep consolidation and reporting stable.",
      },
      {
        label: "Internal Web System for Annual Leave & Expense Claiming:",
        text: "Developed and maintained an internal web system for annual leave and expense claims, streamlining HR and finance processes. Covered the full lifecycle from requirements and design through development, testing, and deployment, plus enhancements, user support, troubleshooting, and data security.",
      },
    ],
  },
  {
    id: "win-promise",
    company: "Win Promise Ltd",
    title: "Analyst Programmer",
    dates: "Aug 2017 \u2013 Aug 2023",
    items: [
      {
        label: "Traffic Control and Surveillance Systems:",
        text: "Delivered a traffic management system to monitor highway site status, detect and report vehicle flow and incidents, and control gantry equipment for route management. Developed the management system and GUI central system for tunnel-to-site equipment communication. Wrote system flow and database design documents.",
      },
      {
        label: "Red Light Camera Central System & Average Speed Camera Central System:",
        text: "Built central systems to control and monitor red light and average speed cameras, collect violation cases, and notify the customer of equipment faults. Developed the GUI, designed the database, and carried out monthly maintenance and fault-rate checks.",
      },
      {
        label: "Electronic Monitor System:",
        text: "Built an electronic monitoring system for EMSD to track street electrical equipment (e.g. street lamps) and alert the customer on faults. Gathered requirements, developed a map-based monitoring website, and generated periodic power-consumption reports.",
      },
    ],
  },
  {
    id: "bigazines",
    company: "Bigazines Consulting Ltd",
    title: "Programmer",
    dates: "Sep 2015 \u2013 Jul 2017",
    items: [
      {
        text: "Developed web UI and backend processing; maintained production web products and handled change requests.",
      },
    ],
  },
  {
    id: "tradelink",
    company: "Tradelink One Ltd",
    title: "Programmer",
    dates: "Sep 2013 \u2013 Jul 2015",
    items: [
      {
        text: "Developed web UI and backend processing, and provided urgent production bug fixes.",
      },
    ],
  },
];

export type Skill = {
  id: string;
  name: string;
  body: string;
  /** Short extracts that already appear inside `body`. Not a separate claim. */
  marks: readonly string[];
};

export const skills: readonly Skill[] = [
  {
    id: "react",
    name: "React / Next.js",
    body: "React 19, Next.js 15, TypeScript 5. Built the clinic CRM frontend with Next.js App Router. UI with Tailwind CSS 4, HeroUI 2, and RSuite; charts, rich-text editing, and date/timezone handling.",
    marks: ["React 19", "Next.js 15", "TypeScript 5", "Tailwind CSS 4", "HeroUI 2", "RSuite"],
  },
  {
    id: "node",
    name: "Node.js",
    body: "Node.js 24. Built the clinic CRM backend with Express 5 (JavaScript). REST APIs, JWT authentication, Redis, Excel/CSV export, PDF generation, email, scheduled jobs, and SFTP/FTP transfer.",
    marks: ["Node.js 24", "Express 5", "JWT", "Redis", "Excel/CSV", "PDF", "SFTP/FTP"],
  },
  {
    id: "database",
    name: "Database",
    body: "Microsoft SQL Server (T-SQL migrations). PostgreSQL. MongoDB. Redis 7.",
    marks: ["Microsoft SQL Server", "T-SQL", "PostgreSQL", "MongoDB", "Redis 7"],
  },
  {
    id: "docker",
    name: "Docker",
    body: "Docker and Docker Compose. Build and package Node 24 Alpine images on Windows, transfer the bundle over SSH, and bring the stack up with Docker Compose on self-hosted Linux, behind an nginx reverse proxy.",
    marks: ["Docker Compose", "Node 24 Alpine", "SSH", "nginx"],
  },
  {
    id: "deploy",
    name: "Deploy / OS",
    body: "Self-hosted Linux production servers. Frontend CI (lint, typecheck, build) on GitHub Actions. Local development on Windows with SQL Server.",
    marks: ["Linux", "GitHub Actions", "Windows", "SQL Server"],
  },
  {
    id: "csharp",
    name: "C# / ASP.NET",
    body: ".NET Framework 4.0, ASP.NET Web Forms \u2014 legacy clinic system used as the source for CRM migration and feature parity.",
    marks: [".NET Framework 4.0", "ASP.NET Web Forms"],
  },
  {
    id: "go",
    name: "Go",
    body: "Communication servers and backend services.",
    marks: ["Communication servers", "backend services"],
  },
  {
    id: "python",
    name: "Python",
    body: "Background processes and Django web systems.",
    marks: ["Background processes", "Django"],
  },
];

for (const skill of skills) {
  for (const mark of skill.marks) {
    if (!skill.body.includes(mark)) {
      throw new Error(`Skill mark is not in the source sentence: ${skill.name} / ${mark}`);
    }
  }
}

export type HistoryRef = {
  id: string;
  name: string;
  kind: "employment" | "freelance";
  href: string;
  external?: boolean;
  note?: string;
  /**
   * Optional logo URL path including the `/SelfIntro` basePath
   * (for example `/SelfIntro/history/grand-hill.svg`).
   * When unset, the banner shows the wordmark until a logo is assigned.
   */
  logo?: string;
};

/** Horizontal history references. Logos are optional until assets are assigned. */
export const historyRefs: readonly HistoryRef[] = [
  {
    id: "grand-hill-wines",
    name: "Grand Hill Wines",
    kind: "freelance",
    href: "https://grandhillwines.com",
    external: true,
    note: "Web",
  },
  ...roles.map((role) => ({
    id: role.id,
    name: role.company,
    kind: "employment" as const,
    href: `#role-${role.id}`,
    note: role.dates,
  })),
];

export const headings = {
  summary: "Professional Summary",
  history: "History",
  employment: "Employment History",
  skills: "Skills",
} as const;
