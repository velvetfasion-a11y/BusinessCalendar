# BusinessCalendar

Exact copy of [Achieve](https://github.com/velvetfasion-a11y/Achieve) (SwiftUI), with the existing **AI Coach** tab powered by local WebLLM + Kokoro inside the app.

## AI Coach (in-app)

The floating nav **AI Coach** section is unchanged in placement. It now hosts the coach engine (WebLLM chat + Kokoro speech) in a `WKWebView` served from bundled `Achieve/CoachWeb` — not a separate product.

Modes remain **Motivation / Routines / Energy**, same as before.

### Build the coach web bundle (required before Xcode)

```bash
cd web
./scripts/sync-coach-web.sh
```

Then open `Achieve.xcodeproj` in Xcode and run on a device/simulator with WebGPU-capable WebKit.

## Web sources

`web/` is only the source for that in-app engine (and a browser preview via `npm run dev`). It is not a standalone app.
