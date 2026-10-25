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
  if (!capabilities.worker || capabilities.hardwareConcurrency <= 2 || (capabilities.deviceMemory && capabilities.deviceMemory <= 2) || segmentationLatencyMs > 420) return 'low'
  if (capabilities.hardwareConcurrency <= 4 || (capabilities.deviceMemory && capabilities.deviceMemory <= 4) || segmentationLatencyMs > 220) return 'medium'
  return 'high'
}

