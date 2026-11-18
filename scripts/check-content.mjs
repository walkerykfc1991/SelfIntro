import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const allowedHref = "https://wa.me/85254635238";

const required = [
  "Walker Yip",
  "Analyst Programmer",
  "Professional Summary",
  "History",
  "Grand Hill Wines",
  "https://grandhillwines.com",
  "Clinic CRM",
  "Freelance web build for the winery",
  "Visit site",
  "View employment",
  "Employment History",
  "walkerykfc@gmail.com",
  "https://www.linkedin.com/in/walker-yip-147008264/",
  "WhatsApp",
  "Analyst Programmer with 13 years\u2019 experience delivering web systems and integrating legacy platforms into new applications.",
  "Currently leading the migration of a clinic system from ASP.NET/C# to a Node.js and React CRM, including APIs, SQL migrations, and production deployment with Docker on Linux.",
  "Earlier work includes RPA, Oracle FCCS on Linux, and traffic and monitoring systems.",
  "MediFast",
  "Feb 2026 \u2013 Present",
  "Clinic CRM Migration",
  "Led the integration of a legacy ASP.NET/C# clinic system into a new Node.js/React CRM, re-implementing core operations so day-to-day clinic work could move off the old platform with feature parity.",
  "System Integration (C# / ASP.NET to Node.js / React)",
  "Analysed existing clinic workflows, data structures, and business rules, then rebuilt them as Node.js services and React interfaces \u2014 including create/view booking, search pickers, overseas pre-insurance presets, in-clinic operations boards, report centre, and medical-form integration with the external client-facing app.",
  "Data and Process Continuity",
  "Implemented SQL migrations and cross-system mappings so bookings, in-clinic records, reports, and medical-form sessions stay consistent between the legacy system and the new CRM. Also delivered production support such as monthly backup and restore for the outbound call list.",
  "Elufa Systems Ltd",
  "Aug 2023 \u2013 Sep 2025",
  "RPA System (Towngas):",
  "Developed a robotic process automation solution for Tagetik monthly reports, replacing manual procedures. Built the full programme, including scheduled extraction and email forwarding to clients.",
  "Oracle Financial Consolidation and Close Service (MTR):",
  "Designed and implemented end-to-end financial consolidation and close processes using Oracle FCCS, aligned with IFRS, GAAP, and other regulatory standards. Managed the EPM Agent for Oracle FCCS on high-availability Linux server clusters, including data integration and process automation, to keep consolidation and reporting stable.",
  "Internal Web System for Annual Leave & Expense Claiming:",
  "Developed and maintained an internal web system for annual leave and expense claims, streamlining HR and finance processes. Covered the full lifecycle from requirements and design through development, testing, and deployment, plus enhancements, user support, troubleshooting, and data security.",
  "Win Promise Ltd",
  "Aug 2017 \u2013 Aug 2023",
  "Traffic Control and Surveillance Systems:",
  "Delivered a traffic management system to monitor highway site status, detect and report vehicle flow and incidents, and control gantry equipment for route management. Developed the management system and GUI central system for tunnel-to-site equipment communication. Wrote system flow and database design documents.",
  "Red Light Camera Central System & Average Speed Camera Central System:",
  "Built central systems to control and monitor red light and average speed cameras, collect violation cases, and notify the customer of equipment faults. Developed the GUI, designed the database, and carried out monthly maintenance and fault-rate checks.",
  "Electronic Monitor System:",
  "Built an electronic monitoring system for EMSD to track street electrical equipment (e.g. street lamps) and alert the customer on faults. Gathered requirements, developed a map-based monitoring website, and generated periodic power-consumption reports.",
  "Bigazines Consulting Ltd",
  "Sep 2015 \u2013 Jul 2017",
  "Developed web UI and backend processing; maintained production web products and handled change requests.",
  "Tradelink One Ltd",
  "Sep 2013 \u2013 Jul 2015",
  "Developed web UI and backend processing, and provided urgent production bug fixes.",
  "React / Next.js",
  "React 19, Next.js 15, TypeScript 5. Built the clinic CRM frontend with Next.js App Router. UI with Tailwind CSS 4, HeroUI 2, and RSuite; charts, rich-text editing, and date/timezone handling.",
  "Node.js 24. Built the clinic CRM backend with Express 5 (JavaScript). REST APIs, JWT authentication, Redis, Excel/CSV export, PDF generation, email, scheduled jobs, and SFTP/FTP transfer.",
  "Microsoft SQL Server (T-SQL migrations). PostgreSQL. MongoDB. Redis 7.",
  "Docker and Docker Compose. Build and package Node 24 Alpine images on Windows, transfer the bundle over SSH, and bring the stack up with Docker Compose on self-hosted Linux, behind an nginx reverse proxy.",
  "Self-hosted Linux production servers. Frontend CI (lint, typecheck, build) on GitHub Actions. Local development on Windows with SQL Server.",
  ".NET Framework 4.0, ASP.NET Web Forms \u2014 legacy clinic system used as the source for CRM migration and feature parity.",
  "Communication servers and backend services.",
  "Background processes and Django web systems.",
];

const forbidden = [
  "MediFast Online",
  "HKV2",
  "MedicsWebAppJS",
  "Cha Kee",
  "cha chaan",
  "food-order",
  "\u8336\u8a18",
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".next" || name === "out" || name === "_next") continue;
    const abs = path.join(dir, name);
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) walk(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(new RegExp(allowedHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function assertNoPhone(raw, label) {
  const redacted = raw.split(allowedHref).join("");
  const patterns = ["85254635238", "+852", "tel:", "5463 5238", "5463-5238"];
  for (const pattern of patterns) {
    if (redacted.toLowerCase().includes(pattern.toLowerCase())) {
      throw new Error(`Phone-like text "${pattern}" found in ${label}`);
    }
  }
}

const sourceFiles = walk(root).filter((file) => {
  if (file.endsWith("package-lock.json") || file.endsWith(`${path.sep}scripts${path.sep}check-content.mjs`)) return false;
  return /\.(tsx?|css|mjs|md|json|svg|html|yml|yaml)$/.test(file);
});

for (const file of sourceFiles) {
  const raw = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  assertNoPhone(raw, rel);
  for (const phrase of forbidden) {
    if (raw.toLowerCase().includes(phrase.toLowerCase())) {
      throw new Error(`Forbidden phrase "${phrase}" found in ${rel}`);
    }
  }
}

const built = path.join(root, "out", "index.html");
if (!fs.existsSync(built)) {
  throw new Error("out/index.html is missing. Run next build first.");
}
const html = fs.readFileSync(built, "utf8");
assertNoPhone(html, "out/index.html");
const text = visibleText(html);
const markup = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
for (const phrase of required) {
  const haystack = phrase.startsWith("http") ? markup : text;
  if (!haystack.includes(phrase)) {
    throw new Error(`Built page is missing: ${phrase}`);
  }
}
for (const phrase of forbidden) {
  if (text.toLowerCase().includes(phrase.toLowerCase()) || html.toLowerCase().includes(phrase.toLowerCase())) {
    throw new Error(`Built page contains forbidden phrase: ${phrase}`);
  }
}

const whatsappLabels = [...html.matchAll(/<a\b[^>]*href="https:\/\/wa\.me\/85254635238"[^>]*>([\s\S]*?)<\/a>/g)].map((match) =>
  match[1].replace(/<[^>]+>/g, "").trim(),
);
if (whatsappLabels.length === 0) {
  throw new Error("WhatsApp link is missing");
}
for (const label of whatsappLabels) {
  if (label !== "WhatsApp") {
    throw new Error(`WhatsApp link text must be exactly "WhatsApp", found "${label}"`);
  }
}

console.log(`Content check passed (${required.length} phrases, ${whatsappLabels.length} WhatsApp links).`);
