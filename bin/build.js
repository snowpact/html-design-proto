#!/usr/bin/env node
// Assemble ONE standalone HTML from a scenario file and the project kit.
//
//   npx -y github:snowpact/html-design-proto build docs/features/foo/prototype.scenario.js
//
// Looks for a `_kit/` folder next to the scenario or in any parent folder, and inlines
// `_kit/app.css`, `_kit/assets.js` and `_kit/screens.js` (each optional) before the scenario.
// `foo.scenario.js` is written to `foo.html` unless --out is given.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const pkg = require("../package.json");
const LIB_DIR = path.join(__dirname, "..");
const CDN = `https://cdn.jsdelivr.net/gh/snowpact/html-design-proto@v${pkg.version}`;

const USAGE = `Usage: html-design-proto build <scenario.js> [--out file.html] [--kit dir] [--inline] [--lang fr]

  --out     output file (default: <name>.html next to <name>.scenario.js)
  --kit     kit folder (default: nearest _kit/ walking up from the scenario)
  --inline  inline the engine instead of loading it from the CDN (local dev, offline)
  --lang    <html lang> attribute (default: fr)`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--inline") args.inline = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i];
    else args._.push(a);
  }
  return args;
}

function findKit(from) {
  let dir = path.resolve(from);
  for (;;) {
    const candidate = path.join(dir, "_kit");
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const read = (file) => (file && fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "");
// A literal "</script" inside inlined JS would close the tag early and blank the page.
const safeJs = (code) => code.replace(/<\/script/gi, "<\\/script");
const safeCss = (code) => code.replace(/<\/style/gi, "<\\/style");

function check(label, code) {
  try {
    new vm.Script(code, { filename: label });
  } catch (e) {
    console.error(`✖ ${label}: ${e.message}`);
    process.exit(1);
  }
}

function build(args) {
  const scenarioFile = args._[1];
  if (!scenarioFile) {
    console.error(USAGE);
    process.exit(1);
  }
  const scenario = read(scenarioFile);
  if (!scenario) {
    console.error(`✖ cannot read ${scenarioFile}`);
    process.exit(1);
  }
  const kit = args.kit || findKit(path.dirname(scenarioFile));
  const css = kit ? read(path.join(kit, "app.css")) : "";
  const assets = kit ? read(path.join(kit, "assets.js")) : "";
  const screens = kit ? read(path.join(kit, "screens.js")) : "";

  if (assets) check("_kit/assets.js", assets);
  if (screens) check("_kit/screens.js", screens);
  check(path.basename(scenarioFile), scenario);

  // The page title is the one given to DesignProto.init(), not the first "title:" of some screen data.
  const initAt = scenario.lastIndexOf("DesignProto.init(");
  const title = (scenario.slice(Math.max(initAt, 0)).match(/title:\s*(["'`])(.+?)\1/) || [])[2] || path.basename(scenarioFile, ".js");
  const engine = args.inline
    ? `<style>\n${safeCss(read(path.join(LIB_DIR, "design-proto.css")))}\n</style>\n<script>\n${safeJs(read(path.join(LIB_DIR, "design-proto.js")))}\n</script>`
    : `<link rel="stylesheet" href="${CDN}/design-proto.css">\n<script src="${CDN}/design-proto.js"></script>`;
  const block = (code) => (code.trim() ? `<script>\n${safeJs(code)}\n</script>\n` : "");

  const out =
    `<!doctype html>
<!-- Built by html-design-proto v${pkg.version} from ${path.basename(scenarioFile)}${kit ? " + " + path.relative(path.dirname(scenarioFile), kit) + "/" : ""}. Edit the sources, not this file. -->
<html lang="${args.lang || "fr"}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title.replace(/</g, "&lt;")}</title>
${engine}
${css.trim() ? `<style>\n${safeCss(css)}\n</style>\n` : ""}</head>
<body>
<div id="root"></div>
` +
    block(assets) +
    block(screens) +
    block(scenario) +
    `</body>
</html>
`;

  const outFile = args.out || scenarioFile.replace(/(\.scenario)?\.js$/, ".html");
  fs.writeFileSync(outFile, out);
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`✔ ${outFile} (${kb(Buffer.byteLength(out))}) — scenario ${kb(scenario.length)}${kit ? `, kit ${path.relative(process.cwd(), kit)}/` : ", no kit"}${args.inline ? ", engine inlined" : `, engine v${pkg.version} from CDN`}`);
}

const args = parseArgs(process.argv.slice(2));
if (args._[0] === "build") build(args);
else {
  console.error(USAGE);
  process.exit(args._[0] ? 1 : 0);
}
