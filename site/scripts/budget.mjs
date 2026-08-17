import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const dist = join(import.meta.dirname, "..", "dist");
const app = join(dist, "app");
const jsLimit = 95 * 1024;
const cssLimit = 15 * 1024;

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (path === app) {
      continue;
    }
    if (entry.isDirectory()) {
      await walk(path, acc);
    } else {
      acc.push(path);
    }
  }
  return acc;
}

const files = await walk(dist);
let js = 0;
let css = 0;

for (const file of files) {
  const gz = gzipSync(await readFile(file)).byteLength;
  if (file.endsWith(".js")) {
    js += gz;
  }
  if (file.endsWith(".css")) {
    css += gz;
  }
}

console.log(`JS gzip ${js} / ${jsLimit}`);
console.log(`CSS gzip ${css} / ${cssLimit}`);

if (js > jsLimit || css > cssLimit) {
  process.exit(1);
}
