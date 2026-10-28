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
