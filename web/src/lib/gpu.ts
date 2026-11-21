export type GpuProbe = {
  supported: boolean
  isolated: boolean
  reason: string | null
}

export async function probeEnvironment(): Promise<GpuProbe> {
  const isolated =
    typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated

  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return {
      supported: false,
      isolated,
      reason:
        'WebGPU is missing. Open this site in Chrome or Edge with WebGPU enabled (see https://webgpureport.org).',
    }
  }

  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    })
    if (!adapter) {
      return {
        supported: false,
        isolated,
        reason:
          'No WebGPU adapter found. Update your GPU drivers or try another device.',
      }
    }
  } catch (err) {
    return {
      supported: false,
      isolated,
      reason: err instanceof Error ? err.message : String(err),
    }
  }

  if (!isolated) {
    return {
      supported: true,
      isolated: false,
      reason:
        'Page is not cross-origin isolated (SharedArrayBuffer). Serve with COOP/COEP headers.',
    }
  }

  return { supported: true, isolated: true, reason: null }
}
