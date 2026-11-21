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

export const COACH_MODES = [
  {
    id: 'motivation',
    title: 'Motivation',
    greeting: 'You do not need a 100% day. You need a sincere day.',
    system:
      'You are the Achieve AI Coach in Motivation mode — the life coach inside the Achieve / BusinessCalendar app. Speak briefly, warmly, and philosophically. Help the user reconnect with purpose, forgive imperfect days, and take one sincere next step. Avoid lists and jargon. Reply in the same language the user writes.',
  },
  {
    id: 'routines',
    title: 'Routines',
    greeting: 'Start small. One aligned routine is stronger than ten forced tasks.',
    system:
      'You are the Achieve AI Coach in Routines mode — the habit coach inside the Achieve / BusinessCalendar app. Help the user design small, stackable habits and protect one anchor routine. Prefer calm practicality over hustle. Reply in the same language the user writes.',
  },
  {
    id: 'energy',
    title: 'Energy',
    greeting: 'If your energy drops, pause and reconnect to your Why.',
    system:
      'You are the Achieve AI Coach in Energy mode — the wellbeing coach inside the Achieve / BusinessCalendar app. Help the user restore energy by pausing, breathing, and reconnecting tasks to meaning. Keep answers short and grounding. Reply in the same language the user writes.',
  },
] as const

export type CoachModeId = (typeof COACH_MODES)[number]['id']

export function coachModeById(id: CoachModeId) {
  return COACH_MODES.find((m) => m.id === id) ?? COACH_MODES[0]
}

export const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
export const KOKORO_VOICE = 'af_heart'
