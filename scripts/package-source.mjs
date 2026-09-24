import { execFileSync } from "node:child_process";
import { access, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const slug = manifest.name.split(" — ")[0]
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const files = [
  "SOURCE-README.md", "ARCHITECTURE.md", "README.md", "PRIVACY.md", "LICENSE",
  "manifest.json", "popup.html", "popup.css", "icons/product-guide.svg", "src", "scripts",
];
await Promise.all(files.map((file) => access(resolve(root, file))));
const archive = `dist/${slug}-${manifest.version}-source.zip`;
await mkdir(resolve(root, "dist"), { recursive: true });
await rm(resolve(root, archive), { force: true });
execFileSync("zip", ["-X", "-q", "-r", archive, ...files], { cwd: root, stdio: "inherit" });
console.log(`Created ${archive}`);
