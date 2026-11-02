import { byId, formatSize } from "../utils/helpers.js";
import { resizeImage } from "./resize.js";
export async function compressImage(file, onProgress = () => {}) {
  const type = byId("formatSelect").value,
    quality = Math.max(0.1, Number(byId("qualitySlider").value) / 100),
    target = Number(byId("targetKB").value);
  if (target && (!Number.isFinite(target) || target < 1 || target > 20480)) throw Error("Target harus antara 1 dan 20480 KB.");
  const image = await resizeImage(file, type, quality);
  let result = image;
  for (let q = quality; ; q = Math.max(0.1, q - 0.12)) {
    result = await imageCompression(image, { fileType: type, initialQuality: q, maxSizeMB: target ? target / 1024 : 20, useWebWorker: true, onProgress });
    if (!target || result.size <= target * 1024 || q === 0.1) break;
  }
  if (target && result.size > target * 1024) throw Error(`Target ${target} KB tidak tercapai; hasil ${formatSize(result.size)}.`);
  return result;
}
