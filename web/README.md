# Viska

Client-side AI chat with spoken replies.

- **WebLLM** (`@mlc-ai/web-llm`) runs an LLM in the browser via WebGPU
- **Kokoro TTS** (`kokoro-js` / Kokoro-82M) reads answers aloud
- **Web Speech API** is used if Kokoro fails to load
- No backend — all inference stays on the device

## Run

```bash
cd web
npm install --onnxruntime-node-install-cuda=skip
npm run dev
```

Open the printed local URL in Chrome or Edge (WebGPU required).

## Notes

- First launch downloads model weights (cached by the browser afterwards).
- Dev server sets COOP/COEP headers so `SharedArrayBuffer` works.
- Default LLM: `SmolLM2-360M-Instruct-q4f16_1-MLC` (swap in the boot screen).
