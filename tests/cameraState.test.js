import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraErrorMessage, cameraErrorState, CAMERA_COPY, CAMERA_STATES, requestCameraStream } from '../src/try-on/camera/cameraState.js'

test('camera permission errors are classified', () => {
  const previous = globalThis.navigator
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia() {} } } })
  assert.equal(cameraErrorState({ name: 'NotAllowedError' }), CAMERA_STATES.PERMISSION_DENIED)
  assert.equal(cameraErrorState({ name: 'NotReadableError' }), CAMERA_STATES.CAMERA_BUSY)
  assert.equal(cameraErrorState({ name: 'NotFoundError' }), CAMERA_STATES.CAMERA_UNAVAILABLE)
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: previous })
})

test('camera opens with default device when preferred constraints are unsupported', async () => {
  const calls = []
  const stream = { id: 'camera-stream' }
  const mediaDevices = { getUserMedia: async constraints => {
    calls.push(constraints)
    if (calls.length === 1) throw { name: 'OverconstrainedError' }
    return stream
  } }

  assert.equal(await requestCameraStream(mediaDevices), stream)
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[1], { video: true, audio: false })
})

test('camera permission errors do not trigger a second camera request', async () => {
  let calls = 0
  const mediaDevices = { getUserMedia: async () => {
    calls++
    throw { name: 'NotAllowedError' }
  } }

  await assert.rejects(requestCameraStream(mediaDevices), { name: 'NotAllowedError' })
  assert.equal(calls, 1)
  assert.match(CAMERA_COPY[CAMERA_STATES.CAMERA_UNAVAILABLE], /browser and device settings/i)
})

test('camera error message exposes the browser error name for troubleshooting', () => {
  assert.match(cameraErrorMessage({ name: 'NotFoundError' }), /Browser error: NotFoundError/)
  assert.match(cameraErrorMessage({ name: 'NotAllowedError' }), /Browser error: NotAllowedError/)
})
