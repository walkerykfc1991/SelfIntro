import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const files = ["next.config.ts", "postcss.config.mjs", "package.json", "package-lock.json", "tsconfig.json"];
const directories = ["app", "components", "lib", "public", "scripts"];

function collect(dir, acc) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) collect(abs, acc);
    else acc.push(abs);
  }
}

export function sourceStamp() {
  const paths = files.map((file) => path.join(root, file));
  for (const dir of directories) collect(path.join(root, dir), paths);
  paths.sort();
  const hash = crypto.createHash("sha256");
  for (const file of paths) {
    hash.update(path.relative(root, file).split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const invoked =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  process.stdout.write(`${sourceStamp()}\n`);
}
