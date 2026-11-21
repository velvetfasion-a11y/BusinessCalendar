import { KOKORO_MODEL_ID, KOKORO_VOICE } from './models'

export type TtsEngine = 'kokoro' | 'webspeech' | 'none'
export type TtsStatus = {
  engine: TtsEngine
  ready: boolean
  loading: boolean
  progress: string
  error: string | null
}

type ProgressCallback = (status: TtsStatus) => void

let kokoro: Awaited<ReturnType<typeof loadKokoro>> | null = null
let currentAudio: HTMLAudioElement | null = null

function formatHfProgress(p: { status?: string; progress?: number }) {
  const label = p.status ?? 'laddar'
  const pct =
    typeof p.progress === 'number' ? Math.round(p.progress * 100) : undefined
  return pct != null ? `Kokoro TTS · ${label} ${pct}%` : `Kokoro TTS · ${label}`
}

async function loadKokoro(onProgress?: ProgressCallback) {
  onProgress?.({
    engine: 'kokoro',
    ready: false,
    loading: true,
    progress: 'Loading Kokoro TTS…',
    error: null,
  })

  const { KokoroTTS } = await import('kokoro-js')

  const preferWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator
  const device = preferWebGpu ? 'webgpu' : 'wasm'
  const dtype = preferWebGpu ? 'fp32' : 'q8'

  try {
    const tts = await KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
      dtype,
      device,
      progress_callback: (p) => {
        onProgress?.({
          engine: 'kokoro',
          ready: false,
          loading: true,
          progress: formatHfProgress(p as { status?: string; progress?: number }),
          error: null,
        })
      },
    })
    return tts
  } catch (webgpuError) {
    if (device === 'wasm') throw webgpuError
    // Retry WASM if WebGPU path fails.
    return KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: (p) => {
        onProgress?.({
          engine: 'kokoro',
          ready: false,
          loading: true,
          progress: formatHfProgress(p as { status?: string; progress?: number }),
          error: null,
        })
      },
    })
  }
}

export async function initTts(onProgress?: ProgressCallback): Promise<TtsStatus> {
  try {
    kokoro = await loadKokoro(onProgress)
    const status: TtsStatus = {
      engine: 'kokoro',
      ready: true,
      loading: false,
      progress: 'Kokoro TTS ready',
      error: null,
    }
    onProgress?.(status)
    return status
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const hasSpeech =
      typeof window !== 'undefined' && 'speechSynthesis' in window
    const status: TtsStatus = {
      engine: hasSpeech ? 'webspeech' : 'none',
      ready: hasSpeech,
      loading: false,
      progress: hasSpeech
        ? 'Using Web Speech API fallback'
        : 'No TTS available',
      error: `Kokoro failed (${message}). Falling back to Web Speech when possible.`,
    }
    onProgress?.(status)
    return status
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    stopSpeaking()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      reject(new Error('Kunde inte spela upp ljud'))
    }
    void audio.play().catch(reject)
  })
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

export async function speak(
  text: string,
  preferred: TtsEngine = 'kokoro',
): Promise<TtsEngine> {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'none'

  if (preferred === 'kokoro' && kokoro) {
    try {
      const raw = await kokoro.generate(cleaned, {
        voice: KOKORO_VOICE,
        speed: 1,
      })
      await playBlob(raw.toBlob())
      return 'kokoro'
    } catch {
      // fall through
    }
  }

  if ('speechSynthesis' in window) {
    await speakWithWebSpeech(cleaned)
    return 'webspeech'
  }

  throw new Error('No TTS engine available')
}
