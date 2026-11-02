import { byId } from "../utils/helpers.js";
export async function resizeImage(file, type, quality) {
  const w = Number(byId("resizeWidth").value),
    h = Number(byId("resizeHeight").value);
  if (!w && !h) return file;
  const bitmap = await createImageBitmap(file);
  let width = w || bitmap.width,
    height = h || bitmap.height;
  if (byId("keepRatio").checked) {
    const ratio = bitmap.width / bitmap.height;
    if (w && h) {
      if (w / h > ratio) width = Math.round(h * ratio);
      else height = Math.round(w / ratio);
    } else if (w) height = Math.round(w / ratio);
    else width = Math.round(h * ratio);
  }
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 12000 || height > 12000) {
    bitmap.close();
    throw Error("Dimensi harus antara 1 dan 12000 px.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(new File([blob], file.name, { type })) : reject(Error("Gagal mengubah ukuran gambar."))), type, quality));
}
export function initResize() {
  document.querySelectorAll(".preset").forEach((button) =>
    button.addEventListener("click", () => {
      byId("resizeWidth").value = button.dataset.w;
      byId("resizeHeight").value = button.dataset.h;
    }),
  );
}
