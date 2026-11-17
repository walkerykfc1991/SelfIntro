import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const manifestPath = path.join(root, ".pages-export.json");

const protectedNames = new Set([
  "app",
  "components",
  "lib",
  "public",
  "scripts",
  ".github",
  "node_modules",
  ".git",
  ".next",
  "out",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next-env.d.ts",
  "postcss.config.mjs",
  "README.md",
  ".gitignore",
  ".pages-export.json",
]);

function assertSafe(rel) {
  const top = rel.split("/")[0];
  if (!top || top === ".." || protectedNames.has(top)) {
    throw new Error(`Refusing to publish over source path: ${rel}`);
  }
}

function walk(dir, base = dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = path.relative(base, abs).split(path.sep).join("/");
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) files.push(...walk(abs, base));
    else files.push(rel);
  }
  return files;
}

if (!fs.existsSync(path.join(outDir, "index.html"))) {
  throw new Error("out/index.html is missing. Run npm run build first.");
}

if (fs.existsSync(manifestPath)) {
  const previous = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const rel of previous.files ?? []) {
    assertSafe(rel);
    fs.rmSync(path.join(root, rel), { force: true });
  }
}

const files = walk(outDir).sort();
for (const rel of files) assertSafe(rel);
for (const rel of files) {
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(outDir, rel), dest);
}

fs.writeFileSync(manifestPath, `${JSON.stringify({ files }, null, 2)}\n`);
console.log(`Published ${files.length} static files to the repository root.`);
