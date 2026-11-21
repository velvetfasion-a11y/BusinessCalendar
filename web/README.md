# Achieve AI Coach (web)

Browser version of the Achieve / BusinessCalendar **AI Coach** — Motivation, Routines, and Energy — running fully client-side.

- **WebLLM** for local chat replies (WebGPU)
- **Kokoro TTS** for spoken answers (`kokoro-js` / Kokoro-82M)
- **Web Speech API** fallback if Kokoro cannot load
- No backend

## Run

```bash
cd web
npm install --onnxruntime-node-install-cuda=skip
npm run dev
```

Open in Chrome or Edge (WebGPU required).
