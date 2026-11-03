// ponytail: native fetch download for vendor bundles. Ceiling: manual script; upgrade path: package.json dependencies + bundler if versioning needs automated renovate/dependabot.
const fs = require("fs");
const path = require("path");

const VENDOR_DIR = path.join(__dirname, "vendor");
if (!fs.existsSync(VENDOR_DIR)) {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
}

const FILES = [
  {
    url: "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js",
    file: "browser-image-compression.js",
  },
  {
    url: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
    file: "jszip.min.js",
  },
  {
    url: "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js",
    file: "pdf-lib.min.js",
  },
  {
    url: "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css",
    file: "cropper.min.css",
  },
  {
    url: "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js",
    file: "cropper.min.js",
  },
];

async function download() {
  for (const item of FILES) {
    const dest = path.join(VENDOR_DIR, item.file);
    console.log(`Downloading ${item.url} -> ${item.file}...`);
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`Failed to fetch ${item.url}: ${res.statusText}`);
    const text = await res.text();
    fs.writeFileSync(dest, text, "utf-8");
    console.log(`Saved ${item.file} (${text.length} bytes)`);
  }
  console.log("All vendor files downloaded successfully!");
}

download().catch((err) => {
  console.error(err);
  process.exit(1);
});
