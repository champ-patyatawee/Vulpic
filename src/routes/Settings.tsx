import { Key, Monitor, FolderOpen, Palette } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { AVAILABLE_MODELS } from "../types/model";
import Button from "../components/common/Button";
import { useUIStore } from "../stores/uiStore";

export default function Settings() {
  const {
    apiKey,
    defaultModel,
    theme,
    galleryFolder,
    setApiKey,
    setDefaultModel,
    setTheme,
    setGalleryFolder,
  } = useSettingsStore();
  const showToast = useUIStore((s) => s.showToast);

  const handleSelectFolder = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const folder = await open({ directory: true });
      if (folder) {
        setGalleryFolder(folder as string);
        showToast("Gallery folder updated", "success");
      }
    } catch {
      showToast("Failed to select folder", "error");
    }
  };

  const handleSaveApiKey = () => {
    showToast("API key saved", "success");
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-6 py-3">
        <h1 className="text-lg font-medium text-text-primary">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-xl space-y-8">
          {/* API Key */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Key size={18} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">
                OpenRouter API Key
              </h2>
            </div>
            <p className="mb-2 text-xs text-text-secondary">
              Your API key is stored securely on your device.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <Button onClick={handleSaveApiKey}>Save</Button>
            </div>
          </section>

          {/* Default Model */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Monitor size={18} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">
                Default Model
              </h2>
            </div>
            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    defaultModel === model.id
                      ? "border-accent bg-accent/5"
                      : "border-border hover:bg-bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="defaultModel"
                    value={model.id}
                    checked={defaultModel === model.id}
                    onChange={(e) => setDefaultModel(e.target.value as any)}
                    className="mt-1 accent-accent"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">
                        {model.name}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {model.pricing}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {model.provider} — {model.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Gallery Folder */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FolderOpen size={18} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">
                Gallery Folder
              </h2>
            </div>
            <p className="mb-2 text-xs text-text-secondary">
              Select a folder to browse images in Gallery mode.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={galleryFolder}
                readOnly
                placeholder="No folder selected"
                className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary outline-none"
              />
              <Button variant="secondary" onClick={handleSelectFolder}>
                Browse
              </Button>
            </div>
          </section>

          {/* Theme */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Palette size={18} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">Theme</h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
