# Achieve AI Coach engine (web sources)

Source for the **in-app** AI Coach tab in Achieve / BusinessCalendar — not a separate product.

- WebLLM for local replies
- Kokoro TTS (Web Speech fallback)
- UI matches the existing AI Coach screen (title, Motivation / Routines / Energy, chat, send)

## Preview in browser

```bash
npm install --onnxruntime-node-install-cuda=skip
npm run dev
```

## Sync into the iOS app

```bash
./scripts/sync-coach-web.sh
```

Copies `dist/` → `../Achieve/CoachWeb` for the in-app `WKWebView`.
