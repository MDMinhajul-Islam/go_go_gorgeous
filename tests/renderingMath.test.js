import test from 'node:test'
import assert from 'node:assert/strict'
import {
  adaptiveFeatherPixels, captureRenderAnchors, concealerRegion, eyeStrokeGeometry,
  isSegmentationCompatible, lipstickProfile, smoothLandmarks,
} from '../src/try-on/core/renderingMath.js'

const landmarks = Array.from({ length: 468 }, () => ({ x: .5, y: .5, z: 0 }))
Object.assign(landmarks[33], { x: .3, y: .4, z: .01 })
Object.assign(landmarks[133], { x: .43, y: .41, z: 0 })
Object.assign(landmarks[159], { x: .36, y: .385 })
Object.assign(landmarks[145], { x: .36, y: .425 })
Object.assign(landmarks[246], { x: .32, y: .395 })
Object.assign(landmarks[161], { x: .34, y: .39 })
Object.assign(landmarks[160], { x: .35, y: .388 })
Object.assign(landmarks[158], { x: .38, y: .389 })
Object.assign(landmarks[157], { x: .4, y: .395 })
Object.assign(landmarks[173], { x: .415, y: .4 })
Object.assign(landmarks[118], { x: .37, y: .49 })
Object.assign(landmarks[263], { x: .7, y: .4 })
Object.assign(landmarks[362], { x: .57, y: .41 })
Object.assign(landmarks[61], { x: .42, y: .65 })
Object.assign(landmarks[291], { x: .58, y: .65 })
Object.assign(landmarks[13], { x: .5, y: .64 })
Object.assign(landmarks[14], { x: .5, y: .67 })

test('lipstick finishes preserve distinct, bounded compositing profiles', () => {
  const matte = lipstickProfile('matte', 100)
  const satin = lipstickProfile('satin', 100)
  assert.ok(matte.multiplyAlpha > satin.multiplyAlpha)
  assert.ok(satin.highlightAlpha > matte.highlightAlpha)
  assert.equal(lipstickProfile('matte', 500).multiplyAlpha, matte.multiplyAlpha)
})

test('adaptive feathering scales with the visible face and quality tier', () => {
  assert.equal(adaptiveFeatherPixels(20), .7)
  assert.equal(adaptiveFeatherPixels(1000), 3.2)
  assert.ok(adaptiveFeatherPixels(240, 'low') < adaptiveFeatherPixels(240, 'high'))
})

test('segmentation compatibility rejects masks captured before meaningful motion', () => {
  const anchors = captureRenderAnchors(landmarks)
  assert.equal(isSegmentationCompatible({ anchors }, landmarks), true)
  const moved = landmarks.map(point => ({ ...point, x: point.x + .04 }))
  assert.equal(isSegmentationCompatible({ anchors }, moved), false)
})

test('landmark smoothing follows large motion faster than sensor jitter', () => {
  const previous = [{ x: .5, y: .5, z: 0 }]
  const tiny = smoothLandmarks(previous, [{ x: .501, y: .5, z: 0 }])[0]
  const large = smoothLandmarks(previous, [{ x: .6, y: .5, z: 0 }])[0]
  assert.ok(tiny.x < .501)
  assert.ok(large.x > .57)
})

test('eyeliner tapers toward the inner eye and fades closed eyes', () => {
  const spec = { upper: [33, 246, 161, 160, 159, 158, 157, 173, 133], top: 159, bottom: 145 }
  const open = eyeStrokeGeometry(landmarks, spec, 1000, 800, 1)
  assert.ok(open.segments[0].width > open.segments.at(-1).width)
  assert.ok(open.wingTip.x < open.wingStart.x)
  const closed = landmarks.map(point => ({ ...point }))
  closed[145] = { ...closed[159] }
  assert.equal(eyeStrokeGeometry(closed, spec, 1000, 800, 1), null)
})

test('concealer region follows the eye angle and remains under-eye centered', () => {
  const region = concealerRegion(landmarks, [33, 133, 118], 1000, 800)
  assert.ok(region.center.y > ((landmarks[33].y + landmarks[133].y) / 2) * 800)
  assert.ok(region.radiusX > region.radiusY)
  assert.ok(region.rotation > 0)
})
