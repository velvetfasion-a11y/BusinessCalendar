export type TtsEngine = 'kokoro' | 'webspeech' | 'none'
export type TtsStatus = {
  engine: TtsEngine
  ready: boolean
  loading: boolean
  progress: string
  error: string | null
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

function speakWithWebSpeech(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Web Speech API missing'))
      return
    }
    stopSpeaking()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = /[åäöÅÄÖ]/.test(text) ? 'sv-SE' : 'en-US'
    utter.rate = 1
    utter.onend = () => resolve()
    utter.onerror = () => reject(new Error('Web Speech failed'))
    window.speechSynthesis.speak(utter)
  })
}

/** Lightweight Listen — browser speech only (no model download). */
export async function speak(
  text: string,
  _preferred: TtsEngine = 'webspeech',
): Promise<TtsEngine> {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'none'
  if ('speechSynthesis' in window) {
    await speakWithWebSpeech(cleaned)
    return 'webspeech'
  }
  throw new Error('No TTS engine available')
}
