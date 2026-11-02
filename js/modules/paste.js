export function initPaste(onFiles) {
  document.addEventListener("paste", (event) => {
    const files = [...event.clipboardData.items]
      .filter((item) => item.type.startsWith("image/"))
      .map((item, index) => {
        const file = item.getAsFile();
        return file && new File([file], `clipboard-${Date.now()}-${index}.${file.type.split("/")[1]}`, { type: file.type });
      })
      .filter(Boolean);
    if (files.length) onFiles(files);
  });
}
