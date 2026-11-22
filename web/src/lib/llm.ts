import { coachModeById, type CoachModeId, type LlmModelId } from './models'
import { probeEnvironment } from './gpu'
import { offlineCoachReply, type CoachContext } from './offlineCoach'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  mode: CoachModeId
}

export type LlmBackend = 'webllm' | 'offline'

export type LlmStatus = {
  ready: boolean
  loading: boolean
  progress: string
  percent: number
  error: string | null
  modelId: string | null
  backend: LlmBackend
}

type Engine = {
  reload: (modelId: string) => Promise<void>
  chat: {
    completions: {
      create: (opts: Record<string, unknown>) => Promise<
        AsyncIterable<{
          choices: Array<{ delta?: { content?: string } }>
        }>
      >
    }
  }
}

let engine: Engine | null = null
let loadedModel: string | null = null
let backend: LlmBackend = 'offline'

export function getBackend() {
  return backend
}

export async function loadLlm(
  modelId: LlmModelId,
  onProgress?: (status: LlmStatus) => void,
): Promise<LlmBackend> {
  onProgress?.({
    ready: false,
    loading: true,
    progress: 'Checking browser…',
    percent: 0,
    error: null,
    modelId,
    backend: 'webllm',
  })

  const env = await probeEnvironment()
  if (!env.supported) {
    backend = 'offline'
    engine = null
    loadedModel = null
    onProgress?.({
      ready: true,
      loading: false,
      progress: 'Built-in Achieve coach ready',
      percent: 100,
      error: env.reason,
      modelId: null,
      backend: 'offline',
    })
    return 'offline'
  }

  try {
    const { CreateMLCEngine, CreateWebWorkerMLCEngine } = await import(
      '@mlc-ai/web-llm'
    )

    const initProgressCallback = (report: {
      progress?: number
      text?: string
    }) => {
      const percent = Math.round((report.progress ?? 0) * 100)
      onProgress?.({
        ready: false,
        loading: true,
        progress: report.text || `Loading model ${percent}%`,
        percent,
        error: null,
        modelId,
        backend: 'webllm',
      })
    }

    if (engine && loadedModel === modelId) {
      backend = 'webllm'
      onProgress?.({
        ready: true,
        loading: false,
        progress: 'WebLLM ready',
        percent: 100,
        error: null,
        modelId,
        backend: 'webllm',
      })
      return 'webllm'
    }

    try {
      const worker = new Worker(
        new URL('../worker/webllm.worker.ts', import.meta.url),
        { type: 'module' },
      )
      engine = (await CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback,
      })) as unknown as Engine
    } catch {
      engine = (await CreateMLCEngine(modelId, {
        initProgressCallback,
      })) as unknown as Engine
    }

    loadedModel = modelId
    backend = 'webllm'
    onProgress?.({
      ready: true,
      loading: false,
      progress: 'WebLLM ready',
      percent: 100,
      error: null,
      modelId,
      backend: 'webllm',
    })
    return 'webllm'
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    backend = 'offline'
    engine = null
    loadedModel = null
    onProgress?.({
      ready: true,
      loading: false,
      progress: 'Built-in Achieve coach ready',
      percent: 100,
      error: `WebLLM unavailable (${message}). Using built-in Achieve coach replies.`,
      modelId: null,
      backend: 'offline',
    })
    return 'offline'
  }
}

export async function streamChat(
  history: ChatMessage[],
  mode: CoachModeId,
  onToken: (fullText: string) => void,
  ctx?: CoachContext,
): Promise<string> {
  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  const userText = lastUser?.content ?? ''

  if (backend !== 'webllm' || !engine) {
    const reply = offlineCoachReply(userText, mode, ctx)
    onToken(reply)
    return reply
  }

  const modeConfig = coachModeById(mode)
  const messages = [
    { role: 'system' as const, content: modeConfig.system },
    ...history
      .filter((m) => m.mode === mode)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })),
  ]

  try {
    const chunks = await engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.65,
      max_tokens: 280,
    })

    let full = ''
    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) {
        full += delta
        onToken(full)
      }
    }
    if (!full.trim()) {
      full = offlineCoachReply(userText, mode, ctx)
      onToken(full)
    }
    return full
  } catch (err) {
    const reply = offlineCoachReply(userText, mode, ctx)
    onToken(reply)
    console.warn('WebLLM chat failed, using offline coach', err)
    return reply
  }
}
