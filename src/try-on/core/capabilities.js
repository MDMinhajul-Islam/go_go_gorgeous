export function detectCapabilities(scope = globalThis) {
  const canvas = scope.document?.createElement?.('canvas')
  const hasContext = type => {
    try { return Boolean(canvas?.getContext?.(type)) } catch { return false }
  }
  const reportedConcurrency = Number(scope.navigator?.hardwareConcurrency)
  const reportedMemory = Number(scope.navigator?.deviceMemory)
  return Object.freeze({
    camera: Boolean(scope.navigator?.mediaDevices?.getUserMedia),
    enumerateDevices: Boolean(scope.navigator?.mediaDevices?.enumerateDevices),
    worker: typeof scope.Worker !== 'undefined',
    offscreenCanvas: typeof scope.OffscreenCanvas !== 'undefined',
    imageBitmap: typeof scope.createImageBitmap !== 'undefined',
    webgl: hasContext('webgl'),
    webgl2: hasContext('webgl2'),
    videoFrameCallback: typeof scope.HTMLVideoElement !== 'undefined' && 'requestVideoFrameCallback' in scope.HTMLVideoElement.prototype,
    hardwareConcurrency: Number.isFinite(reportedConcurrency) && reportedConcurrency > 0 ? Math.floor(reportedConcurrency) : 1,
    deviceMemory: Number.isFinite(reportedMemory) && reportedMemory > 0 ? reportedMemory : null,
  })
}

export function chooseQualityTier(capabilities, segmentationLatencyMs = 0) {
  const concurrency = Number(capabilities?.hardwareConcurrency)
  const memory = Number(capabilities?.deviceMemory)
  const latency = Number(segmentationLatencyMs)
  const cores = Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 1
  const deviceMemory = Number.isFinite(memory) && memory > 0 ? memory : null
  const measuredLatency = Number.isFinite(latency) && latency >= 0 ? latency : Number.POSITIVE_INFINITY
  if (!capabilities?.worker || cores <= 2 || (deviceMemory && deviceMemory <= 2) || measuredLatency > 420) return 'low'
  if (cores <= 4 || (deviceMemory && deviceMemory <= 4) || measuredLatency > 220) return 'medium'
  return 'high'
}

