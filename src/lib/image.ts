/**
 * Shrinks an uploaded photo before we store it.
 * Phone photos are often 3–10 MB; this brings them to ~100–300 KB.
 */
export async function fileToResizedDataUrl(
  file: File,
  maxWidth = 1080,
  quality = 0.8,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process this image.");

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", quality);
}
