const fs = require("fs");
const path = require("path");
const assert = require("assert");

// 1. Verify index.html does not contain CDN scripts and uses local files
const html = fs.readFileSync("./index.html", "utf-8");
assert(!html.includes("cdn.tailwindcss.com"), "index.html should not have Tailwind CDN script");
assert(!html.includes("browser-image-compression@"), "index.html should not use CDN for browser-image-compression");
assert(!html.includes("cdnjs.cloudflare.com/ajax/libs/jszip"), "index.html should not use CDN for jszip");
assert(!html.includes("unpkg.com/pdf-lib"), "index.html should not use CDN for pdf-lib");
assert(!html.includes("cdnjs.cloudflare.com/ajax/libs/cropperjs"), "index.html should not use CDN for cropperjs");

assert(html.includes("./css/tailwind.css"), "index.html should link to ./css/tailwind.css");
assert(html.includes("./vendor/cropper.min.css"), "index.html should link to ./vendor/cropper.min.css");
assert(html.includes("./vendor/browser-image-compression.js"), "index.html should link to ./vendor/browser-image-compression.js");
assert(html.includes("./vendor/jszip.min.js"), "index.html should link to ./vendor/jszip.min.js");
assert(html.includes("./vendor/pdf-lib.min.js"), "index.html should link to ./vendor/pdf-lib.min.js");
assert(html.includes("./vendor/cropper.min.js"), "index.html should link to ./vendor/cropper.min.js");

// 2. Verify vendor files exist on disk with valid sizes
const vendorFiles = [
  "browser-image-compression.js",
  "jszip.min.js",
  "pdf-lib.min.js",
  "cropper.min.css",
  "cropper.min.js",
];
vendorFiles.forEach((f) => {
  const p = path.join("./vendor", f);
  assert(fs.existsSync(p), `vendor file ${p} must exist`);
  assert(fs.statSync(p).size > 1000, `vendor file ${p} must be > 1KB`);
});

// 3. Verify all CORE assets in sw.js exist on disk
const swContent = fs.readFileSync("./sw.js", "utf-8");
const coreMatch = swContent.match(/const CORE = \[([\s\S]*?)\];/);
assert(coreMatch, "sw.js should contain CORE array");
const coreEntries = coreMatch[1]
  .split("\n")
  .map((l) => l.trim().replace(/[",]/g, ""))
  .filter((l) => l && !l.startsWith("//") && l !== "./");

coreEntries.forEach((assetPath) => {
  const resolved = path.join(".", assetPath);
  assert(fs.existsSync(resolved), `Asset in sw.js CORE must exist: ${resolved}`);
});

// 4. Verify css/tailwind.css exists and is non-empty
assert(fs.existsSync("./css/tailwind.css"), "./css/tailwind.css must exist");
const css = fs.readFileSync("./css/tailwind.css", "utf-8");
assert(css.length > 5000, "tailwind.css should contain generated utility classes");

// 5. Verify key Neubrutalism utility classes from index.html & js are present in output css
const expectedTokens = [
  "Space Grotesk",
  "JetBrains Mono",
  "border-b-\\[3px\\]",
  "shadow-\\[0_4px_0_\\#000\\]",
  "shadow-\\[3px_3px_0px_\\#000000\\]",
  "bg-red-100",
];

expectedTokens.forEach((token) => {
  assert(css.includes(token), `tailwind.css should include '${token}'`);
});

// 6. Verify UX Improvements
// Tab-bar responsive styling
const customCss = fs.readFileSync("./css/custom.css", "utf-8");
assert(customCss.includes("overflow-x: auto"), ".tab-bar must have overflow-x: auto");
assert(customCss.includes("white-space: nowrap"), ".tab-bar / buttons must have white-space: nowrap");
assert(customCss.includes("flex-shrink: 0"), ".main-tab-btn must have flex-shrink: 0");

// Batch logic real-time progress & empty state
const batchJs = fs.readFileSync("./js/modules/batch.js", "utf-8");
assert(batchJs.includes("onProgress"), "batch.js must support onProgress callback");

const appJs = fs.readFileSync("./js/app.js", "utf-8");
assert(appJs.includes("file selesai"), "app.js must display 'X dari N file selesai'");
assert(appJs.includes("Antrean Gambar Kosong"), "app.js must render empty state when queue is empty");

// 7. Verify Security Posture
assert(html.includes('<aside aria-label="Slot iklan" hidden'), "Ad slot aside must have hidden attribute");
assert(html.includes('href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Space+Grotesk:wght@500;700;900&display=swap" rel="stylesheet" crossorigin="anonymous"'), "External font stylesheet must have crossorigin='anonymous'");
assert(fs.existsSync("./_headers"), "_headers file for Cloudflare Pages must exist");
const headers = fs.readFileSync("./_headers", "utf-8");
assert(headers.includes("Content-Security-Policy:"), "_headers must define Content-Security-Policy");
assert(headers.includes("default-src 'self'"), "CSP must define default-src 'self'");
assert(headers.includes("worker-src 'self' blob:"), "CSP must allow worker-src 'self' blob:");
assert(headers.includes("img-src 'self' data: blob:"), "CSP must allow img-src 'self' data: blob:");
assert(headers.includes("X-Content-Type-Options: nosniff"), "_headers must include X-Content-Type-Options");

console.log("All offline vendor, Tailwind CSS, UX, and security assertions passed successfully!");



