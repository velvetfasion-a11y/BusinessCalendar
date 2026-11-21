import { SYSTEM_PROMPT, type LlmModelId } from './models'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type LlmStatus = {
  ready: boolean
  loading: boolean
  progress: string
  percent: number
  error: string | null
  modelId: string | null
}

type Engine = {
  reload: (modelId: string) => Promise<void>
  chat: {
    completions: {
      create: (opts: Record<string, unknown>) => Promise<AsyncIterable<{
        choices: Array<{ delta?: { content?: string } }>
      }>>
    }
  }
}

let engine: Engine | null = null
let loadedModel: string | null = null

export function getEngine() {
  return engine
}

export async function loadLlm(
  modelId: LlmModelId,
  onProgress?: (status: LlmStatus) => void,
): Promise<Engine> {
  onProgress?.({
    ready: false,
    loading: true,
    progress: 'Startar WebLLM…',
    percent: 0,
    error: null,
    modelId,
  })

  try {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm')

    const initProgressCallback = (report: { progress?: number; text?: string }) => {
      const percent = Math.round((report.progress ?? 0) * 100)
      onProgress?.({
        ready: false,
        loading: true,
        progress: report.text || `Laddar modell ${percent}%`,
        percent,
        error: null,
        modelId,
      })
    }

    if (engine && loadedModel === modelId) {
      onProgress?.({
        ready: true,
        loading: false,
        progress: 'Modell redan laddad',
        percent: 100,
        error: null,
        modelId,
      })
      return engine
    }

    if (engine && loadedModel !== modelId) {
      await engine.reload(modelId)
      loadedModel = modelId
    } else {
      engine = (await CreateMLCEngine(modelId, {
        initProgressCallback,
      })) as unknown as Engine
      loadedModel = modelId
    }

    onProgress?.({
      ready: true,
      loading: false,
      progress: 'WebLLM redo',
      percent: 100,
      error: null,
      modelId,
    })
    return engine
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    onProgress?.({
      ready: false,
      loading: false,
      progress: 'Misslyckades',
      percent: 0,
      error: message,
      modelId,
    })
    throw err
  }
}

export async function streamChat(
  history: ChatMessage[],
  onToken: (fullText: string) => void,
): Promise<string> {
  if (!engine) throw new Error('WebLLM är inte laddad ännu')

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content })),
  ]

  const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 512,
  })

  let full = ''
  for await (const chunk of chunks) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    if (delta) {
      full += delta
      onToken(full)
    }
  }
  return full
}
