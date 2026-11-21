export const DEFAULT_LLM_MODEL = 'SmolLM2-360M-Instruct-q4f16_1-MLC'

export const LLM_MODELS = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    label: 'SmolLM2 360M',
    hint: 'Snabbast · minst VRAM',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    label: 'Llama 3.2 1B',
    hint: 'Bättre svar · större nedladdning',
  },
  {
    id: 'Qwen3-0.6B-q4f16_1-MLC',
    label: 'Qwen3 0.6B',
    hint: 'Lätt · bra flerspråkighet',
  },
] as const

export type LlmModelId = (typeof LLM_MODELS)[number]['id']

export const SYSTEM_PROMPT =
  'Du är Viska, en hjälpsam assistent som kör helt lokalt i användarens webbläsare. Svara kort, tydligt och på samma språk som användaren skriver. Undvik markdown-tabeller.'

export const KOKORO_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
export const KOKORO_VOICE = 'af_heart'
