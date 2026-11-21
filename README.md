# BusinessCalendar

SwiftUI Achieve app plus a **normal browser website** for the Achieve AI Coach.

## Website (browser)

```bash
cd web
npm install --onnxruntime-node-install-cuda=skip
npm run dev
```

Open the local URL in **Chrome or Edge** (WebGPU). Same AI Coach look (Motivation / Routines / Energy). WebLLM runs in the browser when WebGPU is available; otherwise the built-in Achieve coach replies are used so chat still works. Kokoro TTS with Web Speech fallback.

## iOS

Open `Achieve.xcodeproj` in Xcode (native SwiftUI app, unchanged).
