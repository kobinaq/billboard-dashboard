import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appBuild = join(root, "build");
const dest = join(root, "site", "dist", "app");

if (!existsSync(appBuild)) {
  throw new Error("Missing build/. Run the dashboard build first.");
}

mkdirSync(join(root, "site", "dist"), { recursive: true });
cpSync(appBuild, dest, { recursive: true });
console.log("Copied dashboard build to site/dist/app");
