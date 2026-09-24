export const CAMERA_STATES = Object.freeze({
  IDLE: 'idle',
  EXPLAINING_PERMISSION: 'explainingPermission',
  REQUESTING_PERMISSION: 'requestingPermission',
  STARTING: 'starting',
  WARMING_MODELS: 'warmingModels',
  READY: 'ready',
  NO_FACE: 'noFace',
  MULTIPLE_FACES: 'multipleFaces',
  PERMISSION_DENIED: 'permissionDenied',
  CAMERA_UNAVAILABLE: 'cameraUnavailable',
  CAMERA_BUSY: 'cameraBusy',
  BROWSER_UNSUPPORTED: 'browserUnsupported',
  DEVICE_DISCONNECTED: 'deviceDisconnected',
  RECOVERING: 'recovering',
  MODEL_FAILED: 'modelFailed',
  STOPPED: 'stopped',
})

export function cameraErrorState(error) {
  if (!globalThis.navigator?.mediaDevices?.getUserMedia) return CAMERA_STATES.BROWSER_UNSUPPORTED
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return CAMERA_STATES.PERMISSION_DENIED
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return CAMERA_STATES.CAMERA_UNAVAILABLE
  if (error?.name === 'NotReadableError' || error?.name === 'AbortError') return CAMERA_STATES.CAMERA_BUSY
  return CAMERA_STATES.CAMERA_UNAVAILABLE
}

export async function requestCameraStream(mediaDevices) {
  try {
    return await mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    })
  } catch (error) {
    if (error?.name !== 'NotFoundError' && error?.name !== 'OverconstrainedError') throw error
    return mediaDevices.getUserMedia({ video: true, audio: false })
  }
}

export const CAMERA_COPY = Object.freeze({
  explainingPermission: 'Your camera stays on this device. Continue when you are ready.',
  requestingPermission: 'Waiting for camera permission…',
  starting: 'Starting your camera…',
  warmingModels: 'Preparing the makeup mirror…',
  ready: 'Mirror ready',
  noFace: 'Center your face in the mirror.',
  multipleFaces: 'Multiple faces detected. Please keep one face in view.',
  permissionDenied: 'Camera permission was not granted. You can retry, upload a photo or use a model.',
  cameraUnavailable: 'No camera is visible to your browser. Connect or enable a camera, allow camera access for this site in your browser and device settings, and close other apps using it. Then retry, or use Upload or Model mode.',
  cameraBusy: 'The camera may be in use by another app. Close it there and retry.',
  browserUnsupported: 'This browser does not support live camera Try-On.',
  deviceDisconnected: 'The camera disconnected. Reconnect it and retry.',
  modelFailed: 'The face model could not start. Upload a photo or use a model.',
})

export function cameraErrorMessage(error) {
  const state = cameraErrorState(error)
  const name = typeof error?.name === 'string' ? error.name : 'UnknownError'
  return `${CAMERA_COPY[state]} (Browser error: ${name})`
}
