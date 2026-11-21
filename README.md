# BusinessCalendar / Achieve (web)

Full **Achieve** app as a normal website — not just AI Coach.

## Sections (same as iOS)

1. **Habits** (Achieve) — progress ring, week strip, Dream habits  
2. **AI Coach** — Motivation / Routines / Energy + WebLLM / built-in coach + voice  
3. **Journal** — notes to self  
4. **Schedule** — month calendar + events  
5. **Profile** — account, stats, accent, sticky notes  

Floating bottom nav matches the iOS `FloatingNavBubble`.

## Run

```bash
cd web
npm install --onnxruntime-node-install-cuda=skip
npm run dev
```

Open in Chrome/Edge. Use WebGPU for full WebLLM on the AI Coach tab.
