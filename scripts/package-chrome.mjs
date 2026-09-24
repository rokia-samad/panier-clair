import { execFileSync } from "node:child_process";
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { buildContent, root } from "./build-content.mjs";

execFileSync(process.execPath, [resolve(root, "scripts/build.mjs"), "--check"], { cwd: root, stdio: "inherit" });

const manifest = JSON.parse(await readFile(resolve(root, "manifest.chrome.json"), "utf8"));
const files = [
  "popup.html", "popup.css", "LICENSE", "icons/product-guide.svg",
  "icons/panier-etiq-48.png", "icons/panier-etiq-128.png",
  "src/runtime/chrome-bootstrap.js", "src/data/chrome-background.js",
];
await Promise.all(files.map((file) => access(resolve(root, file))));

const tempRoot = await mkdtemp(resolve(tmpdir(), "panier-etiq-chrome-"));
const archive = resolve(root, `dist/panier-etiq-${manifest.version}-chrome.zip`);
try {
  await writeFile(resolve(tempRoot, "content.js"), await buildContent("src/data/openfoodfacts.chrome.js"));
  await writeFile(resolve(tempRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await Promise.all(files.map(async (file) => {
    const destination = file === "src/runtime/chrome-bootstrap.js"
      ? "chrome-bootstrap.js"
      : file === "src/data/chrome-background.js" ? "background.js" : file;
    const target = resolve(tempRoot, destination);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(resolve(root, file), target);
  }));

  await mkdir(resolve(root, "dist"), { recursive: true });
  await rm(archive, { force: true });
  execFileSync("zip", ["-X", "-q", "-r", archive, "."], { cwd: tempRoot, stdio: "inherit" });
  console.log(`Created ${archive}`);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
