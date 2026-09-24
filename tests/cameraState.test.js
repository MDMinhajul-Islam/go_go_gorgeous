import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraErrorState, CAMERA_STATES } from '../src/try-on/camera/cameraState.js'

test('camera permission errors are classified', () => {
  const previous = globalThis.navigator
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia() {} } } })
  assert.equal(cameraErrorState({ name: 'NotAllowedError' }), CAMERA_STATES.PERMISSION_DENIED)
  assert.equal(cameraErrorState({ name: 'NotReadableError' }), CAMERA_STATES.CAMERA_BUSY)
  assert.equal(cameraErrorState({ name: 'NotFoundError' }), CAMERA_STATES.CAMERA_UNAVAILABLE)
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: previous })
})

