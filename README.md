# BusinessCalendar

Exact copy of [Achieve](https://github.com/velvetfasion-a11y/Achieve) (SwiftUI iOS app), plus a web build of the same **AI Coach**.

## iOS (Achieve)

Open `Achieve.xcodeproj` in Xcode. The AI Coach tab uses Motivation / Routines / Energy modes.

## Web — Achieve AI Coach

Same coach modes, powered by WebLLM + Kokoro in the browser. See [`web/README.md`](web/README.md).

```bash
cd web
npm install --onnxruntime-node-install-cuda=skip
npm run dev
```
