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
 * Works outside Tauri (e.g. in Vite dev server).
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
    // Browser fallback: use an input element
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
    // Browser fallback: trigger a download via an anchor element
    browserDownload(dataUrl, defaultName);
    return;
  }

  const savePath = await save({
    defaultPath: defaultName,
    filters: [
      {
        name: "PNG Image",
        extensions: ["png"],
      },
      {
        name: "JPEG Image",
        extensions: ["jpg", "jpeg"],
      },
    ],
  });

  if (!savePath) return;

  // Convert base64 to Uint8Array
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
 */
export async function readGalleryFolder(folderPath: string): Promise<string[]> {
  // Use the Tauri fs plugin to read directory
  const { readDir } = await import("@tauri-apps/plugin-fs");

  const entries = await readDir(folderPath);
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
  
  return entries
    .filter((entry) => {
      if (!entry.name) return false;
      const ext = entry.name.toLowerCase().split(".").pop();
      return ext && imageExtensions.includes(`.${ext}`);
    })
    .map((entry) => `${folderPath}/${entry.name}`);
}
