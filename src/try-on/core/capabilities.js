export function detectCapabilities(scope = globalThis) {
  const canvas = scope.document?.createElement?.('canvas')
  return Object.freeze({
    camera: Boolean(scope.navigator?.mediaDevices?.getUserMedia),
    enumerateDevices: Boolean(scope.navigator?.mediaDevices?.enumerateDevices),
    worker: typeof scope.Worker !== 'undefined',
    offscreenCanvas: typeof scope.OffscreenCanvas !== 'undefined',
    imageBitmap: typeof scope.createImageBitmap !== 'undefined',
    webgl: Boolean(canvas?.getContext?.('webgl')),
    webgl2: Boolean(canvas?.getContext?.('webgl2')),
    videoFrameCallback: typeof scope.HTMLVideoElement !== 'undefined' && 'requestVideoFrameCallback' in scope.HTMLVideoElement.prototype,
    hardwareConcurrency: scope.navigator?.hardwareConcurrency || 1,
    deviceMemory: scope.navigator?.deviceMemory || null,
  })
}

export function chooseQualityTier(capabilities, segmentationLatencyMs = 0) {
  if (!capabilities.worker || capabilities.hardwareConcurrency <= 2 || (capabilities.deviceMemory && capabilities.deviceMemory <= 2) || segmentationLatencyMs > 420) return 'low'
  if (capabilities.hardwareConcurrency <= 4 || (capabilities.deviceMemory && capabilities.deviceMemory <= 4) || segmentationLatencyMs > 220) return 'medium'
  return 'high'
}

