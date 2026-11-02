import { byId, outputName, download } from "../utils/helpers.js";
export function createBatchQueue({ compress, render, onResult }) {
  const items = [];
  return {
    items,
    add(files) {
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"].includes(file.type)) {
          byId("status").textContent = `${file.name}: format tidak didukung.`;
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          byId("status").textContent = `${file.name}: melebihi batas 20 MB.`;
          continue;
        }
        if (items.some((x) => x.file.name === file.name && x.file.size === file.size)) continue;
        items.push({ file, result: null, state: "Menunggu" });
      }
      render(items);
    },
    async process() {
      for (const item of items) {
        if (item.result) continue;
        item.state = "Memproses";
        render(items);
        try {
          item.result = await compress(item.file);
          item.state = "Selesai";
        } catch (error) {
          item.state = `Gagal: ${error.message}`;
        }
        render(items);
      }
      const first = items.find((x) => x.result);
      if (first) onResult(first);
    },
    async zip() {
      if (items.some((x) => !x.result)) throw Error("Selesaikan semua gambar sebelum ZIP.");
      const zip = new JSZip(),
        names = new Set();
      for (const item of items) {
        const base = outputName(item.file, item.result.type);
        let name = base,
          n = 1;
        while (names.has(name)) name = `${base.replace(/(\.[^.]+)$/i, `-${n++}$1`)}`;
        names.add(name);
        zip.file(name, item.result);
      }
      download(await zip.generateAsync({ type: "blob" }), "quickimg-images.zip");
    },
  };
}
