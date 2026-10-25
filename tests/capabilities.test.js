import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseQualityTier, detectCapabilities } from '../src/try-on/core/capabilities.js'

test('low capability devices choose a conservative tier', () => {
  assert.equal(chooseQualityTier({ worker: false, hardwareConcurrency: 8, deviceMemory: 8 }), 'low')
  assert.equal(chooseQualityTier({ worker: true, hardwareConcurrency: 2, deviceMemory: 8 }), 'low')
})

test('quality tiers honor device and latency thresholds', () => {
  const capable = { worker: true, hardwareConcurrency: 8, deviceMemory: 8 }
  assert.equal(chooseQualityTier(capable, 220), 'high')
  assert.equal(chooseQualityTier(capable, 221), 'medium')
  assert.equal(chooseQualityTier(capable, 421), 'low')
  assert.equal(chooseQualityTier({ ...capable, hardwareConcurrency: 4 }), 'medium')
  assert.equal(chooseQualityTier({ ...capable, deviceMemory: 2 }), 'low')
})

test('quality selection treats missing or malformed measurements conservatively', () => {
  assert.equal(chooseQualityTier(undefined), 'low')
  assert.equal(chooseQualityTier({ worker: true, hardwareConcurrency: Number.NaN, deviceMemory: 8 }), 'low')
  assert.equal(chooseQualityTier({ worker: true, hardwareConcurrency: 8, deviceMemory: 8 }, Number.NaN), 'low')
})

test('capability detection is safe without browser globals', () => {
  const result = detectCapabilities({})
  assert.equal(result.camera, false)
  assert.equal(result.hardwareConcurrency, 1)
})

test('capability detection tolerates blocked graphics probes and invalid device hints', () => {
  const result = detectCapabilities({
    document: { createElement: () => ({ getContext() { throw new Error('blocked') } }) },
    navigator: { hardwareConcurrency: Number.NaN, deviceMemory: -4 },
  })
  assert.equal(result.webgl, false)
  assert.equal(result.webgl2, false)
  assert.equal(result.hardwareConcurrency, 1)
  assert.equal(result.deviceMemory, null)
})
