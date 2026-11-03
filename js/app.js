import { byId, formatSize, outputName, download } from "./utils/helpers.js";
import { compressImage } from "./modules/compress.js";
import { initResize } from "./modules/resize.js";
import { initCrop } from "./modules/crop.js";
import { createBatchQueue } from "./modules/batch.js";
import { initPaste } from "./modules/paste.js";
import { initZipCreator, initPdfTools, initSvgCleaner } from "./modules/doctools.js";
let selected = null,
  originalUrl = "",
  resultUrl = "";
function render(items) {
  const area = byId("batchList");
  area.replaceChildren();
  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "batch-item flex items-center justify-between gap-3 border-2 border-black bg-white p-3 text-sm shadow-[3px_3px_0px_#000] rounded-md";
    row.dataset.index = index;
    const info = document.createElement("div"),
      name = document.createElement("p"),
      detail = document.createElement("p");
    info.className = "min-w-0";
    name.className = "truncate font-mono font-bold text-xs sm:text-sm text-black";
    name.textContent = item.file.name;
    // KRITIS-3: zinc-600 on white → 5.8:1 ✅ WCAG AA
    detail.className = "font-mono text-xs text-zinc-600";
    detail.textContent = `${formatSize(item.file.size)} • ${item.state}${item.result ? ` • hasil ${formatSize(item.result.size)}` : ""}`;
    info.append(name, detail);
    // KRITIS-1: aria-label akurat per state | KRITIS-2: pisah tombol aksi & hapus
    const actions = document.createElement("div");
    actions.className = "flex items-center gap-1.5 shrink-0";

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = "item-action border-2 border-black bg-[#FFE600] px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000] hover:bg-[#fde047] active:translate-x-0.5 active:translate-y-0.5 rounded";
    if (item.result) {
      actionBtn.textContent = "⬇ Unduh";
      actionBtn.setAttribute("aria-label", `Unduh hasil ${item.file.name}`);
      actionBtn.onclick = () => download(item.result, outputName(item.file, item.result.type));
    } else {
      actionBtn.textContent = "👁 Preview";
      actionBtn.setAttribute("aria-label", `Preview ${item.file.name}`);
      actionBtn.onclick = () => {
        selected = item;
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        originalUrl = URL.createObjectURL(item.file);
        byId("selectedFile").hidden = false;
        byId("fileName").textContent = item.file.name;
        byId("fileSize").textContent = formatSize(item.file.size);
        byId("originalPreview").src = originalUrl;
        byId("resultArea").hidden = true;
        render(queue.items);
      };
    }

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "border-2 border-black bg-white px-2.5 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000] hover:bg-red-100 active:translate-x-0.5 active:translate-y-0.5 rounded";
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", `Hapus ${item.file.name} dari antrian`);
    removeBtn.onclick = () => {
      queue.items.splice(index, 1);
      if (selected === item) selected = null;
      render(queue.items);
    };

    actions.append(actionBtn, removeBtn);
    row.append(info, actions);
    area.append(row);
  });
  byId("processBtn").disabled = !items.some((x) => !x.result) || items.some((x) => x.state === "Memproses");
  byId("zipBtn").disabled = !items.length || items.some((x) => !x.result);
  byId("cropBtn").disabled = !selected;
  byId("batchCount").textContent = items.length ? `${items.length} gambar · ${items.filter((item) => item.result).length} selesai` : "Tambahkan gambar untuk mulai";
  byId("processLabel").textContent = items.some((x) => !x.result) ? "Proses Gambar" : "✅ Selesai Diproses";
  const progress = byId("status").querySelector(".progress-track");
  if (progress) progress.setAttribute("aria-label", `Proses ${items.filter((item) => item.result).length} dari ${items.length}`);
}
function showResult(item) {
  selected = item;
  if (originalUrl) URL.revokeObjectURL(originalUrl);
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  originalUrl = URL.createObjectURL(item.file);
  resultUrl = URL.createObjectURL(item.result);
  byId("originalPreview").src = originalUrl;
  byId("fileName").textContent = item.file.name;
  byId("fileSize").textContent = formatSize(item.file.size);
  byId("selectedFile").hidden = false;
  byId("resultPreview").src = originalUrl;
  byId("compressedPreview").src = resultUrl;
  byId("originalSize").textContent = formatSize(item.file.size);
  byId("newSize").textContent = formatSize(item.result.size);
  const saving = Math.round((1 - item.result.size / item.file.size) * 100);
  byId("savingsBadge").textContent = saving > 0 ? `Hemat ${saving}%` : `Ukuran bertambah ${Math.abs(saving)}%`;
  byId("largerWarning").hidden = item.result.size < item.file.size;
  byId("originalDownload").href = originalUrl;
  byId("downloadBtn").href = resultUrl;
  byId("downloadBtn").download = outputName(item.file, item.result.type);
  byId("resultArea").hidden = false;
  render(queue.items);
}
const queue = createBatchQueue({ compress: compressImage, render, onResult: showResult });
function toast(message) {
  let node = document.getElementById("toast");
  if (!node) {
    node = document.createElement("div");
    node.id = "toast";
    node.className = "toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.append(node);
  }
  node.textContent = message;
  node.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("visible"), 2600);
}
// MAJOR-5 + MAJOR-7: Tab settings — konten sudah inline di HTML, cukup toggle visibility + aria
document.querySelectorAll(".settings-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".settings-tab").forEach((btn) => btn.setAttribute("aria-selected", String(btn === tab)));
    document.querySelectorAll(".setting-group").forEach((panel) => {
      const match = panel.id === `sgroup-${tab.dataset.tab}`;
      panel.classList.toggle("active", match);
      panel.hidden = !match;
    });
  }),
);
// Arrow key navigation pada tablist (WAI-ARIA pattern)
document.querySelector('[role="tablist"][aria-label="Pengaturan gambar"]')?.addEventListener("keydown", (e) => {
  const tabs = [...document.querySelectorAll(".settings-tab")];
  const idx = tabs.indexOf(document.activeElement);
  if (idx === -1) return;
  if (e.key === "ArrowRight") { e.preventDefault(); tabs[(idx + 1) % tabs.length].focus(); tabs[(idx + 1) % tabs.length].click(); }
  if (e.key === "ArrowLeft")  { e.preventDefault(); tabs[(idx - 1 + tabs.length) % tabs.length].focus(); tabs[(idx - 1 + tabs.length) % tabs.length].click(); }
});
function accept(files) {
  const before = queue.items.length;
  queue.add(files);
  const added = queue.items.slice(before);
  if (added[0]) showResult(added[0]);
}
const input = byId("imageInput"),
  dropzone = byId("dropzone");
dropzone.addEventListener("click", () => input.click());
input.addEventListener("change", () => {
  accept([...input.files]);
  input.value = "";
});
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  accept([...e.dataTransfer.files]);
});
byId("processBtn").addEventListener("click", async () => {
  // MAJOR-6: feedback label saat proses berjalan
  const label = byId("processLabel");
  label.textContent = "⏳ Memproses…";
  byId("processBtn").disabled = true;
  byId("processSpinner").hidden = false;
  byId("status").innerHTML = '<span class="progress-track mb-2 block"></span>Memproses gambar langsung di perangkat…';
  try {
    await queue.process();
    byId("status").textContent = queue.items.some((x) => x.state.startsWith("Gagal")) ? "Beberapa gambar gagal diproses; periksa status." : "Selesai! Hasil siap diunduh.";
    toast("Kompresi selesai!");
  } finally {
    byId("processSpinner").hidden = true;
    render(queue.items); // restore label via render()
  }
});
byId("zipBtn").addEventListener("click", () => queue.zip().catch((error) => (byId("status").textContent = error.message)));
initResize();
initCrop(
  () => selected,
  (item) => {
    selected = item;
    byId("selectedFile").hidden = false;
    byId("fileName").textContent = item.file.name;
    byId("fileSize").textContent = formatSize(item.file.size);
    byId("originalPreview").src = URL.createObjectURL(item.file);
    byId("resultArea").hidden = true;
    render(queue.items);
  },
);
initPaste((files) => {
  accept(files);
  toast("Gambar ditempel dari clipboard!");
});
byId("qualitySlider").addEventListener("input", (e) => (byId("qualityValue").value = `${e.target.value}%`));
// MINOR-12: Konfirmasi dua-langkah — klik pertama ganti label, klik kedua eksekusi
let resetPending = false, resetTimer;
byId("resetBtn").addEventListener("click", () => {
  if (!resetPending) {
    resetPending = true;
    byId("resetBtn").textContent = "Yakin Reset?";
    byId("resetBtn").classList.add("bg-red-100");
    resetTimer = setTimeout(() => {
      resetPending = false;
      byId("resetBtn").textContent = "Ganti Gambar";
      byId("resetBtn").classList.remove("bg-red-100");
    }, 3000);
    return;
  }
  clearTimeout(resetTimer);
  resetPending = false;
  byId("resetBtn").textContent = "Ganti Gambar";
  byId("resetBtn").classList.remove("bg-red-100");
  if (originalUrl) URL.revokeObjectURL(originalUrl);
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  originalUrl = "";
  resultUrl = "";
  queue.items.length = 0;
  selected = null;
  byId("selectedFile").hidden = true;
  byId("resultArea").hidden = true;
  byId("status").textContent = "Pilih gambar baru untuk memulai.";
  render(queue.items);
});

// MAJOR-7: Tab Navigation dengan arrow key support
const tabBtns = document.querySelectorAll(".main-tab-btn");
const tabPanels = document.querySelectorAll(".main-tab-panel");
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => { b.setAttribute("aria-selected", "false"); b.classList.remove("main-tab-active"); });
    tabPanels.forEach((p) => p.hidden = true);
    btn.setAttribute("aria-selected", "true");
    btn.classList.add("main-tab-active");
    byId(btn.getAttribute("aria-controls")).hidden = false;
  });
});
document.querySelector('[aria-label="Pilih kategori alat"]')?.addEventListener("keydown", (e) => {
  const btns = [...tabBtns];
  const idx = btns.indexOf(document.activeElement);
  if (idx === -1) return;
  if (e.key === "ArrowRight") { e.preventDefault(); btns[(idx + 1) % btns.length].focus(); btns[(idx + 1) % btns.length].click(); }
  if (e.key === "ArrowLeft")  { e.preventDefault(); btns[(idx - 1 + btns.length) % btns.length].focus(); btns[(idx - 1 + btns.length) % btns.length].click(); }
});

// Init doc tools
initZipCreator();
initPdfTools();
initSvgCleaner();

if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
