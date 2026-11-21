#!/usr/bin/env bash
# Build the coach web UI and copy it into the iOS app bundle folder.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
DEST="$REPO/Achieve/CoachWeb"

cd "$ROOT"
npm install --onnxruntime-node-install-cuda=skip
npm run build

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$ROOT/dist/." "$DEST/"

# Ensure engine.html is at the CoachWeb root for the static server.
if [[ ! -f "$DEST/engine.html" ]]; then
  echo "engine.html missing from build output" >&2
  exit 1
fi

echo "Synced coach web → Achieve/CoachWeb"
