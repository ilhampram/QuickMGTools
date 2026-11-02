import { byId } from "../utils/helpers.js";
let cropper = null,
  sourceUrl = "",
  current = null;
export function initCrop(getSelected, onChange) {
  const image = byId("cropImage"),
    dialog = byId("cropDialog");
  byId("cropBtn").addEventListener("click", () => {
    current = getSelected();
    if (!current) return;
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = URL.createObjectURL(current.file);
    image.onload = () => {
      cropper?.destroy();
      cropper = new Cropper(image, { viewMode: 1, autoCropArea: 0.9, aspectRatio: NaN });
    };
    image.src = sourceUrl;
    dialog.showModal();
  });
  byId("cropRatio").addEventListener("change", (e) => cropper?.setAspectRatio(Number(e.target.value)));
  byId("cropCancel").addEventListener("click", () => dialog.close());
  byId("cropApply").addEventListener("click", () => {
    if (!cropper || !current) return;
    cropper.getCroppedCanvas().toBlob((blob) => {
      if (!blob) return;
      current.file = new File([blob], current.file.name.replace(/\.[^.]+$/, ".png"), { type: "image/png" });
      current.result = null;
      current.state = "Menunggu";
      onChange(current);
      dialog.close();
    }, "image/png");
  });
  dialog.addEventListener("close", () => {
    cropper?.destroy();
    cropper = null;
  });
}
