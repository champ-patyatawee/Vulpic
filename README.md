# Vulpic — AI Image Editor & Design Studio

https://github.com/user-attachments/assets/d92ec82e-872f-411a-9c0f-f0719b4f84d5

**Vulpic** is a free, open-source desktop app that combines AI Generate, edit, and design images with AI — no subscriptions, no lock-in, just your own API key.

**Pay as you go, not per month.** Bring your own API key — you pay only for the images you generate, typically cents per image. No subscription, no monthly bill, no feature gates.

### What You Can Do

#### Generate Images
- Text-to-image using top AI models (GPT-5, Gemini, Seedream, FLUX, etc.)
- Reference image editing (upload an image + describe the edit)
- Configurable aspect ratio (1:1, 16:9, 9:16, 4:3, etc.) and resolution (1K–4K)
- Chat-style interface with persistent history

#### Edit Images Locally
- **Crop** with Canva-style drag handles, rule-of-thirds guides, aspect ratio presets
- **Rotate** (90°, 180°, 270°) and **Flip** (horizontal/vertical)
- **Filters** (brightness, contrast, sepia, grayscale, blur, and more)
- **AI Edit** — describe changes with text, and AI applies them
- Gallery view with sort by date, name, or file modification time

#### Design Templates
- Generate design variations from templates: Posters, Logos, Branding, Infographics, Product Mockups, Ads Creative
- AI writes the design prompt → you pick which to render
- Prompt text is copyable, results are auto-saved
- No design skills needed

#### Privacy & Ownership
- Everything runs locally on your machine
- Your API key stays on your device
- Images store on your disk — not in someone's cloud
- Open source (MIT) — no lock-in, ever

## Quick Start



**Download the latest release:**
[https://github.com/champ-patyatawee/Vulpic/releases](https://github.com/champ-patyatawee/Vulpic/releases)

Or build from source:

```bash
git clone https://github.com/champ-patyatawee/Vulpic.git
cd Vulpic
npm install
npx tauri dev
```

1. Get an API key at [openrouter.ai/keys](https://openrouter.ai/keys) (free credits available)
2. Paste it in Settings → API Key
3. Choose your model and start generating

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4
- **Desktop:** Tauri 2 (Rust) — small bundle, native performance
- **AI:** OpenRouter API — access to 100+ models from one API
- **Storage:** Zustand + IndexedDB — persistent, no backend needed

## Why Open Source?

- **No subscription trap** — you own the software forever
- **No data collection** — everything stays on your computer
- **Community-driven** — features are built for users, not shareholders
- **Transparent** — you can see exactly how it works

## Downloads

**Get the latest build:** [github.com/champ-patyatawee/Vulpic/releases](https://github.com/champ-patyatawee/Vulpic/releases)

| Platform | Architecture |
|----------|-------------|
| macOS | Universal (Intel + Apple Silicon) |
| Windows | x86_64 |
| Linux | x86_64 |

## License

MIT — free to use, modify, and distribute.
