import { execFileSync } from "node:child_process";
import { access, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, [resolve(root, "scripts/build.mjs"), "--check"], { cwd: root, stdio: "inherit" });

const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const slug = manifest.name.split(" — ")[0]
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const assets = [...new Set([
  "manifest.json", "content.js", "popup.html", "popup.css", "LICENSE", "README.md",
  ...Object.values(manifest.icons), manifest.action.default_icon,
])];
await Promise.all(assets.map((asset) => access(resolve(root, asset))));
const archive = `dist/${slug}-${manifest.version}-unsigned.xpi`;
await mkdir(resolve(root, "dist"), { recursive: true });
await rm(resolve(root, archive), { force: true });
execFileSync("zip", ["-X", "-q", archive, ...assets], { cwd: root, stdio: "inherit" });
console.log(`Created ${archive}`);
