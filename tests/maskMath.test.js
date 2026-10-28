import test from 'node:test'
import assert from 'node:assert/strict'
import { createClassAlpha, writeAlphaChannel } from '../src/try-on/core/maskMath.js'

test('class alpha includes requested regions and explicitly excludes protected classes', () => {
  const labels = new Uint8Array([0, 12, 13, 11, 1, 12])
  assert.deepEqual([...createClassAlpha(labels, [12, 13], [11])], [0, 255, 255, 0, 0, 255])
})

test('class alpha validates label and image dimensions', () => {
  assert.throws(() => createClassAlpha([12], [12]), TypeError)
  const image = { data: new Uint8ClampedArray(8) }
  assert.throws(() => writeAlphaChannel(image, new Uint8ClampedArray(1)), RangeError)
  writeAlphaChannel(image, new Uint8ClampedArray([10, 20]))
  assert.deepEqual([...image.data], [0, 0, 0, 10, 0, 0, 0, 20])
})
