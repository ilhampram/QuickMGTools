import { byId, formatSize, outputName, download } from "./utils/helpers.js";
import { compressImage } from "./modules/compress.js";
import { initResize } from "./modules/resize.js";
import { initCrop } from "./modules/crop.js";
import { createBatchQueue } from "./modules/batch.js";
import { initPaste } from "./modules/paste.js";
let selected = null,
  originalUrl = "",
  resultUrl = "";
function render(items) {
  const area = byId("batchList");
  area.replaceChildren();
  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "batch-item flex items-center justify-between gap-3 border-2 border-black bg-white p-3 text-sm shadow-[3px_3px_0px_#000] dark:bg-zinc-900 dark:border-white dark:shadow-[3px_3px_0px_#fff]";
    row.dataset.index = index;
    const info = document.createElement("div"),
      name = document.createElement("p"),
      detail = document.createElement("p");
    info.className = "min-w-0";
    name.className = "truncate font-mono font-bold text-xs sm:text-sm text-black dark:text-white";
    name.textContent = item.file.name;
    detail.className = "font-mono text-xs text-zinc-600 dark:text-zinc-400";
    detail.textContent = `${formatSize(item.file.size)} • ${item.state}${item.result ? ` • hasil ${formatSize(item.result.size)}` : ""}`;
    info.append(name, detail);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "item-action border-2 border-black bg-[#FFE600] px-3 py-1 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000] hover:bg-[#fde047] active:translate-x-0.5 active:translate-y-0.5";
    remove.textContent = item.result ? "Unduh" : "Pilih";
    remove.setAttribute("aria-label", `Hapus ${item.file.name}`);
    remove.onclick = () => {
      if (remove.classList.contains("item-action") && item.result) {
        download(item.result, outputName(item.file, item.result.type));
        return;
      }
      if (remove.classList.contains("item-action") && !item.result) {
        selected = item;
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        originalUrl = URL.createObjectURL(item.file);
        byId("selectedFile").hidden = false;
        byId("fileName").textContent = item.file.name;
        byId("fileSize").textContent = formatSize(item.file.size);
        byId("originalPreview").src = originalUrl;
        byId("resultArea").hidden = true;
        render(queue.items);
        return;
      }
      queue.items.splice(index, 1);
      if (selected === item) selected = null;
      render(queue.items);
    };
    row.append(info, remove);
    area.append(row);
  });
  byId("processBtn").disabled = !items.some((x) => !x.result) || items.some((x) => x.state === "Memproses");
  byId("zipBtn").disabled = !items.length || items.some((x) => !x.result);
  byId("cropBtn").disabled = !selected;
  byId("batchCount").textContent = items.length ? `${items.length} gambar · ${items.filter((item) => item.result).length} selesai` : "Tambahkan gambar untuk mulai";
  byId("processLabel").textContent = items.some((x) => !x.result) ? "Proses gambar" : "Selesai diproses";
  const progress = byId("status").querySelector(".progress-track");
  if (progress) progress.setAttribute("aria-label", `Proses ${items.filter((item) => item.result).length} dari ${items.length}`);
  area.querySelectorAll(".batch-item").forEach((row) => {
    const item = items[Number(row.dataset.index)];
    if (!item) return;
    const action = row.querySelector(".item-action");
    if (item.result) {
      action.textContent = "Unduh";
      action.setAttribute("aria-label", `Unduh ${item.file.name}`);
      action.onclick = () => download(item.result, outputName(item.file, item.result.type));
    } else {
      action.textContent = "Pilih";
      action.setAttribute("aria-label", `Pilih ${item.file.name}`);
      action.onclick = () => {
        selected = item;
        byId("selectedFile").hidden = false;
        byId("fileName").textContent = item.file.name;
        byId("fileSize").textContent = formatSize(item.file.size);
        byId("originalPreview").src = URL.createObjectURL(item.file);
        byId("resultArea").hidden = true;
        render(queue.items);
      };
    }
  });
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
const groups = Object.fromEntries([...document.querySelectorAll(".setting-group")].map((group) => [group.dataset.group, group]));
groups.compression.append(byId("qualitySlider").parentElement, byId("targetKB").closest("label"));
groups.dimensions.append(document.querySelectorAll(".control-drawer fieldset")[0]);
groups.crop.append(byId("cropBtn"));
groups.export.append(byId("formatSelect").closest("label"), byId("namePrefix").closest("label").parentElement);
document.querySelectorAll(".settings-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".settings-tab").forEach((button) => button.setAttribute("aria-selected", String(button === tab)));
    document.querySelectorAll(".setting-group").forEach((group) => group.classList.toggle("active", group.dataset.group === tab.dataset.tab));
  }),
);
document.querySelector('.settings-tab[data-tab="compression"]').click();
const mobileQuery = matchMedia("(max-width: 640px)");
function setMobileDrawer() {
  document.querySelectorAll(".setting-group").forEach((group) => (group.hidden = mobileQuery.matches && !group.classList.contains("active")));
}
setMobileDrawer();
mobileQuery.addEventListener?.("change", setMobileDrawer);
document.querySelectorAll(".settings-tab").forEach((tab) => tab.addEventListener("click", setMobileDrawer));
const themeToggle = byId("themeToggle");
function updateThemeToggle() {
  const dark = document.documentElement.classList.contains("dark");
  themeToggle.setAttribute("aria-label", dark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
  themeToggle.title = dark ? "Aktifkan mode terang" : "Aktifkan mode gelap";
  themeToggle.querySelector("span").textContent = dark ? "☀" : "☾";
}
updateThemeToggle();
themeToggle.addEventListener("click", () => {
  const dark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("quickimg-theme", dark ? "dark" : "light");
  updateThemeToggle();
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
  byId("processSpinner").hidden = false;
  byId("status").innerHTML = '<span class="progress-track mb-2 block"></span>Memproses gambar langsung di perangkat…';
  try {
    await queue.process();
    byId("status").textContent = queue.items.some((x) => x.state.startsWith("Gagal")) ? "Beberapa gambar gagal diproses; periksa status." : "Selesai! Hasil siap diunduh.";
    toast("Kompresi selesai!");
  } finally {
    byId("processSpinner").hidden = true;
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
byId("resetBtn").addEventListener("click", () => {
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
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
