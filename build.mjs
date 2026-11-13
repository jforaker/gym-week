// Tiny build: inlines src/page/* into one HTML string and drops it into the
// worker at __PAGE_HTML__, writing dist/index.js. No dependencies.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const PAGE_DIR = "src/page";
const read = (p) => readFileSync(p, "utf8");
const isLocal = (href) => !/^(https?:)?\/\//.test(href);

let html = read(join(PAGE_DIR, "index.html"));

// <link rel="stylesheet" href="local.css"> → <style>…</style>
html = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g, (tag, href) =>
  isLocal(href) ? `<style>\n${read(join(PAGE_DIR, href))}</style>` : tag);

// <script src="local.js"></script> → <script>…</script>
html = html.replace(/<script\s+src="([^"]+)"\s*><\/script>/g, (tag, src) =>
  isLocal(src) ? `<script>\n${read(join(PAGE_DIR, src)).replace(/<\/script/gi, "<\\/script")}</script>` : tag);

const worker = read("src/index.js");
if (!worker.includes("__PAGE_HTML__")) throw new Error("src/index.js is missing __PAGE_HTML__");
const out = worker.replace("__PAGE_HTML__", () => JSON.stringify(html));

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.js", out);
console.log(`built dist/index.js (${(out.length / 1024).toFixed(1)} KiB)`);
