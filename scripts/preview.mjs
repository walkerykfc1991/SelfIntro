import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const outDir = path.resolve("out");
const port = Number(process.env.PORT || 4173);
const prefix = "/SelfIntro";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

if (!fs.existsSync(path.join(outDir, "index.html"))) {
  console.error("out/index.html is missing. Run npm run build first.");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url === "/" || url === prefix) {
    res.writeHead(302, { Location: `${prefix}/` });
    res.end();
    return;
  }
  if (!url.startsWith(`${prefix}/`)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  let rel = url.slice(prefix.length);
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.resolve(outDir, `.${rel}`);
  if (!file.startsWith(outDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Preview: http://localhost:${port}/SelfIntro/`);
});
