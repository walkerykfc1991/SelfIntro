import fs from "node:fs";
import { sourceStamp } from "./source-stamp.mjs";

const stamp = sourceStamp();
const htmlPath = "index.html";
if (!fs.existsSync(htmlPath)) {
  console.error("index.html is missing. Run npm run build && npm run sync.");
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, "utf8");
const matched =
  html.includes(`name="source-stamp" content="${stamp}"`) ||
  html.includes(`content="${stamp}" name="source-stamp"`);
if (!matched) {
  console.error("The committed page does not match the current source.");
  console.error("Run npm run build && npm run sync, then commit the export.");
  process.exit(1);
}
console.log(`Published page matches source ${stamp.slice(0, 12)}.`);
