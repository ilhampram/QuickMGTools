export const byId = (id) => document.getElementById(id);
export const formatSize = (bytes) => (bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(2)} MB`);
export function outputName(file, type) {
  const ext = type === "image/jpeg" ? "jpg" : type.split("/")[1];
  return `${byId("namePrefix").value}${file.name.replace(/\.[^.]+$/, "")}${byId("nameSuffix").value}.${ext}`;
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
