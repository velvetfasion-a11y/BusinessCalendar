# Achieve AI Coach (website)

Normal website — open in any modern browser. Same AI Coach UI as Achieve.

```bash
npm install --onnxruntime-node-install-cuda=skip
npm run dev
```

- **WebLLM** when WebGPU is available (Chrome/Edge)
- **Built-in Achieve coach** replies as fallback so chat always works
- **Kokoro TTS** + Web Speech fallback

Deploy the `dist/` folder (after `npm run build`) to any static host. Keep COOP/COEP headers (`public/_headers` / `vercel.json`).
