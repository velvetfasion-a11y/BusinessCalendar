export type TtsEngine = 'webspeech' | 'none'

export type SpeakOptions = {
  voiceId?: string
  /** 0–100 from settings; 50 ≈ natural pace */
  speed?: number
}

type VoiceProfile = {
  prefer: RegExp[]
  langPrefer: string[]
  pitch: number
  rateBias: number
}

/** Map Achieve voice labels onto browser SpeechSynthesis characteristics. */
const VOICE_PROFILES: Record<string, VoiceProfile> = {
  Puck: {
    prefer: [/puck/i, /fred/i, /daniel/i, /aaron/i, /male/i],
    langPrefer: ['en-US', 'en-GB', 'en'],
    pitch: 1.25,
    rateBias: 1.05,
  },
  Algieba: {
    prefer: [/albert/i, /arthur/i, /bruce/i, /male/i],
    langPrefer: ['en-GB', 'en-US', 'en'],
    pitch: 0.82,
    rateBias: 0.95,
  },
  Orus: {
    prefer: [/oliver/i, /gordon/i, /daniel/i, /male/i],
    langPrefer: ['en-GB', 'en-US', 'en'],
    pitch: 0.95,
    rateBias: 1,
  },
  Leda: {
    prefer: [/samantha/i, /karen/i, /moira/i, /female/i, /woman/i],
    langPrefer: ['en-US', 'en-GB', 'en'],
    pitch: 1.08,
    rateBias: 0.98,
  },
  Aoede: {
    prefer: [/karen/i, /fiona/i, /tessa/i, /female/i],
    langPrefer: ['en-GB', 'en-AU', 'en-US', 'en'],
    pitch: 1.15,
    rateBias: 1.02,
  },
  Kore: {
    prefer: [/samantha/i, /victoria/i, /karen/i, /female/i],
    langPrefer: ['en-US', 'en-GB', 'en'],
    pitch: 1.05,
    rateBias: 1,
  },
}

function listVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices()
}

/** iOS often populates voices asynchronously. */
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([])
      return
    }
    const ready = listVoices()
    if (ready.length) {
      resolve(ready)
      return
    }
    const synth = window.speechSynthesis
    const finish = () => {
      synth.removeEventListener('voiceschanged', finish)
      resolve(listVoices())
    }
    synth.addEventListener('voiceschanged', finish)
    // Fallback if event never fires.
    setTimeout(finish, 400)
  })
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  voiceId: string,
  text: string,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  const swedish = /[åäöÅÄÖ]/.test(text)
  if (swedish) {
    const sv =
      voices.find((v) => /^sv/i.test(v.lang)) ||
      voices.find((v) => /swedish|svenska/i.test(v.name))
    if (sv) return sv
  }

  const profile = VOICE_PROFILES[voiceId] ?? VOICE_PROFILES.Puck
  const byLang = (langs: string[]) =>
    voices.filter((v) => langs.some((l) => v.lang.toLowerCase().startsWith(l.toLowerCase())))

  let pool = byLang(profile.langPrefer)
  if (!pool.length) pool = voices.filter((v) => /^en/i.test(v.lang))
  if (!pool.length) pool = voices

  for (const re of profile.prefer) {
    const hit = pool.find((v) => re.test(v.name))
    if (hit) return hit
  }
  return pool[0] ?? voices[0] ?? null
}

function speedToRate(speed: number, bias: number) {
  // 0 → 0.7, 50 → 1.0, 100 → 1.35
  const t = Math.min(100, Math.max(0, speed)) / 100
  const base = 0.7 + t * 0.65
  return Math.min(1.6, Math.max(0.5, base * bias))
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export async function speak(
  text: string,
  options: SpeakOptions = {},
): Promise<TtsEngine> {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'none'
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('Speech not available in this browser')
  }

  const voiceId = options.voiceId ?? 'Puck'
  const speed = options.speed ?? 50
  const profile = VOICE_PROFILES[voiceId] ?? VOICE_PROFILES.Puck
  const voices = await ensureVoicesLoaded()
  const voice = pickVoice(voices, voiceId, cleaned)

  stopSpeaking()

  await new Promise<void>((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(cleaned)
    utter.lang = /[åäöÅÄÖ]/.test(cleaned)
      ? 'sv-SE'
      : (voice?.lang || 'en-US')
    if (voice) {
      try {
        utter.voice = voice
      } catch {
        // Some engines reject non-native voice objects — pitch/rate still apply.
      }
    }
    utter.pitch = profile.pitch
    utter.rate = speedToRate(speed, profile.rateBias)
    utter.onend = () => resolve()
    utter.onerror = (ev) => {
      // iOS fires "interrupted" / "canceled" when we stop for a new speak — treat as soft end.
      const err = (ev as SpeechSynthesisErrorEvent).error
      if (err === 'interrupted' || err === 'canceled') resolve()
      else reject(new Error(`Speech failed (${err || 'unknown'})`))
    }
    // Chrome sometimes needs a tick after cancel before speak.
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utter)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Speech failed'))
      }
    }, 20)
  })

  return 'webspeech'
}

export function previewVoice(voiceId: string, speed: number) {
  const line =
    voiceId === 'Puck'
      ? 'Hey — I am Puck. One sincere step at a time.'
      : `Hi, I'm ${voiceId}. Ready when you are.`
  return speak(line, { voiceId, speed })
}
