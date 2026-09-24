import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildContent } from "./build-content.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = await buildContent();
const target = resolve(root, "content.js");
if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8");
  if (current !== output) {
    console.error("content.js is outdated. Run node scripts/build.mjs.");
    process.exitCode = 1;
  } else {
    console.log("content.js is up to date");
  }
} else {
  await writeFile(target, output);
  console.log("Built content.js from src/");
}
