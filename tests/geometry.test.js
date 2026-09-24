import test from 'node:test'
import assert from 'node:assert/strict'
import { computeLetterbox } from '../src/try-on/core/geometry.js'

test('landscape source is vertically letterboxed without distortion', () => {
  assert.deepEqual(computeLetterbox(1600, 900), { x: 0, y: 112, width: 512, height: 288, scale: 0.32 })
})

test('portrait source is horizontally letterboxed without distortion', () => {
  assert.deepEqual(computeLetterbox(900, 1600), { x: 112, y: 0, width: 288, height: 512, scale: 0.32 })
})

test('invalid dimensions fail explicitly', () => {
  assert.throws(() => computeLetterbox(0, 100), RangeError)
})
