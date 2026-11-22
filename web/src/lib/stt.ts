type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

type RecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function speechRecognitionSupported() {
  return getRecognitionCtor() != null
}

let active: SpeechRecognitionLike | null = null

export function stopListening() {
  if (!active) return
  try {
    active.onresult = null
    active.onerror = null
    active.onend = null
    active.stop()
  } catch {
    // ignore
  }
  active = null
}

/**
 * Start dictation into the composer.
 * Calls onPartial for interim text and onFinal when a phrase settles.
 */
export function startListening(opts: {
  lang?: string
  onPartial?: (text: string) => void
  onFinal?: (text: string) => void
  onError?: (message: string) => void
  onEnd?: () => void
}): boolean {
  const Ctor = getRecognitionCtor()
  if (!Ctor) {
    opts.onError?.(
      'Voice typing isn’t supported in this browser. Try Chrome, or type your message.',
    )
    return false
  }

  stopListening()
  const rec = new Ctor()
  active = rec
  rec.lang = opts.lang ?? 'en-US'
  rec.continuous = false
  rec.interimResults = true
  rec.maxAlternatives = 1

  let finalText = ''

  rec.onresult = (ev) => {
    let interim = ''
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const piece = ev.results[i][0]?.transcript ?? ''
      if (ev.results[i].isFinal) finalText += piece
      else interim += piece
    }
    const shown = (finalText + interim).trim()
    if (shown) opts.onPartial?.(shown)
    if (finalText.trim()) opts.onFinal?.(finalText.trim())
  }

  rec.onerror = (ev) => {
    const code = ev.error || 'error'
    if (code === 'aborted' || code === 'no-speech') {
      opts.onEnd?.()
      return
    }
    if (code === 'not-allowed') {
      opts.onError?.('Microphone permission denied. Allow mic access and try again.')
    } else {
      opts.onError?.(`Voice typing failed (${code}).`)
    }
    opts.onEnd?.()
  }

  rec.onend = () => {
    if (active === rec) active = null
    opts.onEnd?.()
  }

  try {
    rec.start()
    return true
  } catch (err) {
    active = null
    opts.onError?.(
      err instanceof Error ? err.message : 'Could not start voice typing',
    )
    opts.onEnd?.()
    return false
  }
}
