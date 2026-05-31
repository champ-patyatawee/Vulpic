import { open } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { save } from "@tauri-apps/plugin-dialog";

/**
 * Check if we are running inside a Tauri desktop app.
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Download a data URL using the browser's native download mechanism.
 */
function browserDownload(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Open a file picker dialog for selecting images.
 */
export async function pickImage(): Promise<{ path: string; name: string } | null> {
  if (!isTauri()) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/gif,image/webp";
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const path = URL.createObjectURL(file);
          resolve({ path, name: file.name });
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }

  const result = await open({
    multiple: false,
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp"],
      },
    ],
  });

  if (!result) return null;
  const path = result as string;
  const name = path.split("/").pop() ?? "image.png";
  return { path, name };
}

/**
 * Save a base64 data URL to a file on disk.
 */
export async function saveImage(dataUrl: string, defaultName: string = "vulpic-edit.png"): Promise<void> {
  if (!isTauri()) {
    browserDownload(dataUrl, defaultName);
    return;
  }

  const savePath = await save({
    defaultPath: defaultName,
    filters: [
      { name: "PNG Image", extensions: ["png"] },
      { name: "JPEG Image", extensions: ["jpg", "jpeg"] },
    ],
  });

  if (!savePath) return;

  const base64Data = dataUrl.split(",")[1] ?? dataUrl;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  await writeFile(savePath, bytes);
}

/**
 * Read image files from a directory for the gallery.
 * Returns paths with file modification timestamps.
 */
export async function readGalleryFolder(folderPath: string): Promise<{ path: string; mtime: number }[]> {
  const { readDir } = await import("@tauri-apps/plugin-fs");

  const entries = await readDir(folderPath);
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

  const result: { path: string; mtime: number }[] = [];

  for (const entry of entries) {
    if (!entry.name) continue;
    const ext = entry.name.toLowerCase().split(".").pop();
    if (!ext || !imageExtensions.includes(`.${ext}`)) continue;

    result.push({
      path: `${folderPath}/${entry.name}`,
      mtime: (entry as any).mtime ?? Date.now(),
    });
  }

  return result;
}
