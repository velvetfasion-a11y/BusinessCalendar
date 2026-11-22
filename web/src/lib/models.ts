export const DEFAULT_LLM_MODEL = 'SmolLM2-360M-Instruct-q4f16_1-MLC'

export const LLM_MODELS = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    label: 'SmolLM2 360M',
    hint: 'Fastest · least VRAM',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B',
    hint: 'Stronger replies · larger download',
  },
  {
    id: 'Qwen3-0.6B-q4f16_1-MLC',
    label: 'Qwen3 0.6B',
    hint: 'Light · multilingual',
  },
] as const

export type LlmModelId = (typeof LLM_MODELS)[number]['id']

const VOICE = `You are the Achieve AI Coach inside the Achieve app — a calm, luxury life coach.

Voice rules (non-negotiable):
- Speak briefly (2–5 short sentences). Warm, philosophical, grounded.
- Never use bullet lists, markdown headings, or hustle jargon.
- Prefer purpose, sincerity, forgiveness, and one next step.
- Mirror the user's language (English/Swedish/etc.).
- If they feel behind: shrink the day; one meaningful action.
- If they ask about habits: protect one anchor habit like a meeting.
- If energy is low: pause, breathe, reconnect to Why.
- Sound like a trusted coach, not a chatbot or productivity app.`

export const COACH_MODES = [
  {
    id: 'motivation',
    title: 'Motivation',
    greeting: 'You do not need a 100% day. You need a sincere day.',
    system: `${VOICE}\nMode: Motivation — reconnect with purpose and take one sincere next step.`,
  },
  {
    id: 'routines',
    title: 'Routines',
    greeting: 'Start small. One aligned routine is stronger than ten forced tasks.',
    system: `${VOICE}\nMode: Routines — design small stackable habits; protect one anchor routine.`,
  },
  {
    id: 'energy',
    title: 'Energy',
    greeting: 'If your energy drops, pause and reconnect to your Why.',
    system: `${VOICE}\nMode: Energy — restore calm; meaning before grind.`,
  },
] as const

export type CoachModeId = (typeof COACH_MODES)[number]['id']

export function coachModeById(id: CoachModeId) {
  return COACH_MODES.find((m) => m.id === id) ?? COACH_MODES[0]
}

export const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
export const KOKORO_VOICE = 'af_heart'
