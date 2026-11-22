# Achieve

Phone-first web app matching the Achieve iOS product: **Habits · Chat · Note** (Gold Dark).

**Live:** [velvetfasion-a11y.github.io/BusinessCalendar](https://velvetfasion-a11y.github.io/BusinessCalendar/)

## Run locally

```bash
cd web
npm install
npm run dev
```

Open on a phone-width viewport (or DevTools device mode).

## Deploy (GitHub Pages)

```bash
cd web
GITHUB_PAGES=1 npm run build
cp -a docs/assets assets
cp docs/index.html index.html
```

Pages serves from the `main` branch root. Bundle is ~260KB — no WebLLM/Kokoro WASM.

## iOS

The Swift project in `Achieve/` remains in the repo. The live website is the luxury 3-tab product UI.
