import { useState, useEffect } from "react";
import { Key, Monitor, FolderOpen, Palette } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import type { AIModel } from "../types/model";
import { fetchImageModels, fetchTextModels } from "../services/openrouter";
import Button from "../components/common/Button";
import ModelSelector from "../components/common/ModelSelector";
import { useUIStore } from "../stores/uiStore";

export default function Settings() {
  const {
    apiKey,
    defaultModel,
    editModel,
    templateModel,
    theme,
    galleryFolder,
    setApiKey,
    setDefaultModel,
    setEditModel,
    setTemplateModel,
    setTheme,
    setGalleryFolder,
  } = useSettingsStore();
  const showToast = useUIStore((s) => s.showToast);

  const [models, setModels] = useState<AIModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [textModels, setTextModels] = useState<AIModel[]>([]);
  const [textModelsLoading, setTextModelsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const key = useSettingsStore.getState().apiKey;
        const list = await fetchImageModels(key);
        setModels(list);
      } catch {
        const { AVAILABLE_MODELS } = await import("../types/model");
        setModels(AVAILABLE_MODELS);
      } finally {
        setModelsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const key = useSettingsStore.getState().apiKey;
        const list = await fetchTextModels(key);
        setTextModels(list);
      } catch {
        const { TEXT_MODELS } = await import("../types/model");
        setTextModels(TEXT_MODELS);
      } finally {
        setTextModelsLoading(false);
      }
    })();
  }, []);

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
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
              <Button onClick={handleSaveApiKey}>Save</Button>
            </div>
          </section>

          {/* Generation Model */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Monitor size={18} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">
                Generation Model
              </h2>
            </div>
            <p className="mb-2 text-xs text-text-secondary">
              Used when generating new images.
            </p>
            {modelsLoading ? (
              <p className="text-xs text-text-tertiary py-2">Loading models...</p>
            ) : (
              <ModelSelector
                models={models}
                selected={defaultModel}
                onSelect={setDefaultModel}
              />
            )}
          </section>

          {/* Edit Model */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Monitor size={18} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">
                Edit Model
              </h2>
            </div>
            <p className="mb-2 text-xs text-text-secondary">
              Used when editing images with AI.
            </p>
            {modelsLoading ? (
              <p className="text-xs text-text-tertiary py-2">Loading models...</p>
            ) : (
              <ModelSelector
                models={models}
                selected={editModel}
                onSelect={setEditModel}
              />
            )}
          </section>

          {/* Template Model (text) */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Monitor size={18} className="text-text-secondary" />
              <h2 className="text-sm font-medium text-text-primary">
                Template Model
              </h2>
            </div>
            <p className="mb-2 text-xs text-text-secondary">
              Text model used to generate prompt templates (e.g. GPT-4o, Claude).
            </p>
            {textModelsLoading ? (
              <p className="text-xs text-text-tertiary py-2">Loading models...</p>
            ) : (
              <ModelSelector
                models={textModels}
                selected={templateModel}
                onSelect={setTemplateModel}
              />
            )}
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

      <footer className="flex justify-end border-t border-border px-6 py-3">
        <span className="text-xs text-text-tertiary">v0.1.0</span>
      </footer>
    </div>
  );
}
