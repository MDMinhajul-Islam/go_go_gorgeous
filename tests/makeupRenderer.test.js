import test from 'node:test'
import assert from 'node:assert/strict'
import { MakeupRenderer } from '../src/try-on/rendering/makeupRenderer.js'

function fakeCanvas() {
  const context = {
    clearRect() {},
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    filter: 'none',
  }
  return { width: 0, height: 0, getContext: () => context, context }
}

test('renderer reuses named buffers instead of allocating every frame', () => {
  let allocations = 0
  const renderer = new MakeupRenderer(() => { allocations++; return fakeCanvas() })
  const first = renderer.buffer('concealer', 640, 480).canvas
  const second = renderer.buffer('concealer', 640, 480).canvas
  assert.equal(first, second)
  assert.equal(allocations, 1)
  assert.equal(first.width, 640)
  assert.equal(first.height, 480)
})

test('a new segmentation version invalidates semantic masks once', () => {
  const renderer = new MakeupRenderer(fakeCanvas)
  let masks = 0
  const module = { createClassMask() { masks++; return { width: 1, height: 1 } } }
  const segmentation = { labels: new Uint8Array([1]) }
  renderer.setSegmentation(segmentation, module, 1)
  assert.equal(renderer.mask([1], 1), renderer.mask([1], 1))
  assert.equal(masks, 1)
  renderer.setSegmentation({ labels: new Uint8Array([1]) }, module, 2)
  renderer.mask([1], 1)
  assert.equal(masks, 2)
})

test('concealer renders bounded gradients without allocating a full-frame buffer', () => {
  let allocations = 0
  let fills = 0
  const gradient = { addColorStop() {} }
  const context = {
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, arc() {},
    fill() { fills++ },
    getImageData() { return { data: new Uint8ClampedArray(5 * 5 * 4).fill(128) } },
    createRadialGradient() { return gradient },
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
  }
  const renderer = new MakeupRenderer(() => { allocations++; return fakeCanvas() })
  const landmarks = Array.from({ length: 468 }, () => ({ x: .5, y: .5, z: 0 }))
  Object.assign(landmarks[33], { x: .35, y: .4 })
  Object.assign(landmarks[133], { x: .45, y: .4 })
  Object.assign(landmarks[118], { x: .4, y: .47 })
  Object.assign(landmarks[263], { x: .65, y: .4 })
  Object.assign(landmarks[362], { x: .55, y: .4 })
  Object.assign(landmarks[347], { x: .6, y: .47 })

  renderer.drawConcealer(context, landmarks, 1600, 900, { c: '#dba77e' }, 82)

  assert.equal(allocations, 0)
  assert.equal(fills, 6)
})
