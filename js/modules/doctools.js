// Document & File Tools module
// PDF: pdf-lib | ZIP: JSZip (already loaded) | SVG: native JS
import { byId, formatSize, download } from "../utils/helpers.js";

// ── ZIP Creator ──────────────────────────────────────────────────────────────
export function initZipCreator() {
  const zone = byId("docDropzone");
  const fileInput = byId("docFileInput");
  const list = byId("docFileList");
  const createBtn = byId("docZipBtn");
  const statusEl = byId("docStatus");
  let files = [];

  function renderList() {
    list.replaceChildren();
    files.forEach((f, i) => {
      const row = document.createElement("div");
      row.className =
        "flex items-center justify-between gap-3 border-2 border-black bg-white p-2.5 text-xs font-mono shadow-[2px_2px_0px_#000] rounded-md";
      const info = document.createElement("span");
      info.className = "truncate font-bold text-black";
      info.textContent = `${f.name}  (${formatSize(f.size)})`;
      const rem = document.createElement("button");
      rem.type = "button";
      rem.className =
        "border border-black bg-[#FF4B91] px-2 py-0.5 font-black text-white text-[10px] uppercase rounded";
      rem.textContent = "✕";
      rem.onclick = () => { files.splice(i, 1); renderList(); updateBtn(); };
      row.append(info, rem);
      list.append(row);
    });
    byId("docFileCount").textContent = files.length
      ? `${files.length} file ditambahkan`
      : "Belum ada file";
  }

  function updateBtn() { createBtn.disabled = files.length === 0; }

  function addFiles(incoming) {
    for (const f of incoming)
      if (!files.some((x) => x.name === f.name && x.size === f.size)) files.push(f);
    renderList(); updateBtn();
  }

  zone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => { addFiles([...fileInput.files]); fileInput.value = ""; });
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("dragover"); addFiles([...e.dataTransfer.files]); });

  createBtn.addEventListener("click", async () => {
    if (!files.length) return;
    statusEl.textContent = "Membuat ZIP…";
    try {
      const zip = new JSZip();
      files.forEach((f) => zip.file(f.name, f));
      const blob = await zip.generateAsync({ type: "blob" });
      download(blob, `quicktools-${Date.now()}.zip`);
      statusEl.textContent = `ZIP selesai! (${formatSize(blob.size)})`;
    } catch (e) {
      statusEl.textContent = `Gagal: ${e.message}`;
    }
  });
}

// ── PDF Tools (pdf-lib) ──────────────────────────────────────────────────────
export function initPdfTools() {
  const zone = byId("pdfDropzone");
  const input = byId("pdfFileInput");
  const list = byId("pdfFileList");
  const mergeBtn = byId("pdfMergeBtn");
  const compressBtn = byId("pdfCompressBtn");
  const statusEl = byId("pdfStatus");
  let pdfFiles = [];

  function renderList() {
    list.replaceChildren();
    pdfFiles.forEach((f, i) => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-3 border-2 border-black bg-white p-2.5 text-xs font-mono shadow-[2px_2px_0px_#000] rounded-md";
      const info = document.createElement("span");
      info.className = "truncate font-bold text-black";
      info.textContent = `${f.name}  (${formatSize(f.size)})`;
      const rem = document.createElement("button");
      rem.type = "button";
      rem.className = "border border-black bg-[#FF4B91] px-2 py-0.5 font-black text-white text-[10px] uppercase rounded";
      rem.textContent = "✕";
      rem.onclick = () => { pdfFiles.splice(i, 1); renderList(); updateBtns(); };
      row.append(info, rem);
      list.append(row);
    });
    byId("pdfFileCount").textContent = pdfFiles.length ? `${pdfFiles.length} PDF` : "Belum ada PDF";
  }

  function updateBtns() {
    mergeBtn.disabled = pdfFiles.length < 2;
    compressBtn.disabled = pdfFiles.length === 0;
  }

  function addPdfs(incoming) {
    for (const f of incoming) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        statusEl.textContent = `${f.name}: bukan PDF.`; continue;
      }
      if (!pdfFiles.some((x) => x.name === f.name && x.size === f.size)) pdfFiles.push(f);
    }
    renderList(); updateBtns();
  }

  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", () => { addPdfs([...input.files]); input.value = ""; });
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("dragover"); addPdfs([...e.dataTransfer.files]); });

  mergeBtn.addEventListener("click", async () => {
    statusEl.textContent = "Menggabungkan…"; mergeBtn.disabled = true;
    try {
      const { PDFDocument } = PDFLib;
      const merged = await PDFDocument.create();
      for (const f of pdfFiles) {
        const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const blob = new Blob([await merged.save()], { type: "application/pdf" });
      download(blob, `merged-${Date.now()}.pdf`);
      statusEl.textContent = `Merge selesai! (${formatSize(blob.size)})`;
    } catch (e) { statusEl.textContent = `Gagal: ${e.message}`; }
    finally { updateBtns(); }
  });

  compressBtn.addEventListener("click", async () => {
    statusEl.textContent = "Mengompresi…"; compressBtn.disabled = true;
    try {
      const { PDFDocument } = PDFLib;
      for (const f of pdfFiles) {
        const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
        // ponytail: strips xref/metadata only; canvas-render needed for image recompression
        const outBytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
        const blob = new Blob([outBytes], { type: "application/pdf" });
        const pct = (((f.size - blob.size) / f.size) * 100).toFixed(1);
        download(blob, `compressed-${f.name}`);
        statusEl.textContent = `${f.name}: ${formatSize(f.size)} → ${formatSize(blob.size)} (${pct > 0 ? `-${pct}%` : "sama"})`;
      }
    } catch (e) { statusEl.textContent = `Gagal: ${e.message}`; }
    finally { updateBtns(); }
  });
}

// ── SVG Cleaner ──────────────────────────────────────────────────────────────
export function initSvgCleaner() {
  const zone = byId("svgDropzone");
  const input = byId("svgFileInput");
  const statusEl = byId("svgStatus");
  const cleanBtn = byId("svgCleanBtn");
  let currentFile = null;

  function loadSvg(f) {
    if (!f.name.toLowerCase().endsWith(".svg") && f.type !== "image/svg+xml") {
      statusEl.textContent = `${f.name}: bukan SVG.`; return;
    }
    currentFile = f;
    // MINOR-13: nama file di elemen terpisah dari status operasi
    byId("svgFileName").textContent = `📄 ${f.name} (${formatSize(f.size)})`;
    statusEl.textContent = "";
    cleanBtn.disabled = false;
  }

  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", () => { if (input.files[0]) loadSvg(input.files[0]); input.value = ""; });
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault(); zone.classList.remove("dragover");
    if (e.dataTransfer.files[0]) loadSvg(e.dataTransfer.files[0]);
  });

  cleanBtn.addEventListener("click", async () => {
    if (!currentFile) return;
    const text = await currentFile.text();
    const cleaned = text
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
      .replace(/<\?.*?\?>/g, "")
      .replace(/\s+/g, " ")
      .replace(/> </g, "><")
      .trim();
    const blob = new Blob([cleaned], { type: "image/svg+xml" });
    const pct = (((currentFile.size - blob.size) / currentFile.size) * 100).toFixed(1);
    download(blob, `cleaned-${currentFile.name}`);
    statusEl.textContent = `Selesai: ${formatSize(currentFile.size)} → ${formatSize(blob.size)} (-${pct}%)`;
  });
}
