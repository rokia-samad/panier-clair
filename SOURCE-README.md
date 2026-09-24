# Panier Etiq 0.3.3 — source build instructions for AMO reviewers

The extension is built from plain JavaScript in `src/`. There are no third-party dependencies, minification, network downloads, or package manager steps. `scripts/build.mjs` concatenates the source files in a fixed order into `content.js`.

Build environment: Node.js 24 or later on Linux or macOS. The optional XPI packaging step also needs the standard `zip` command.

From the root of this source archive, run:

```sh
node scripts/build.mjs
node scripts/build.mjs --check
node scripts/package.mjs
```

The generated `content.js` should match the file in the submitted `panier-etiq-0.3.3-unsigned.xpi`. The XPI is written to `dist/` by the last command. No generated files are included in this source archive.

See `CHANGELOG.md` for the user-facing changes in this version.
