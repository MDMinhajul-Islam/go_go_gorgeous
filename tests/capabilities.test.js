import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseQualityTier, detectCapabilities } from '../src/try-on/core/capabilities.js'

test('low capability devices choose a conservative tier', () => {
  assert.equal(chooseQualityTier({ worker: false, hardwareConcurrency: 8, deviceMemory: 8 }), 'low')
  assert.equal(chooseQualityTier({ worker: true, hardwareConcurrency: 2, deviceMemory: 8 }), 'low')
})

test('capability detection is safe without browser globals', () => {
  const result = detectCapabilities({})
  assert.equal(result.camera, false)
  assert.equal(result.hardwareConcurrency, 1)
})
