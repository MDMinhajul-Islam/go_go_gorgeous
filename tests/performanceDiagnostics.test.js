import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PerformanceDiagnostics,
  cosmeticCondition,
  percentile,
  summarizeSamples,
} from '../src/try-on/core/performanceDiagnostics.js'

test('percentiles and summaries ignore invalid samples', () => {
  assert.equal(percentile([10, 30, 20, Number.NaN, -1]), 30)
  assert.deepEqual(summarizeSamples([10, 20, 30]), { count: 3, average: 20, p95: 30 })
  assert.deepEqual(summarizeSamples([Number.NaN, -1]), { count: 0, average: null, p95: null })
})

test('cosmetic conditions distinguish the required benchmark states', () => {
  const lipstick = { category: 'lipstick', enabled: true }
  const eyeliner = { category: 'eyeliner', enabled: true }
  const concealer = { category: 'concealer', enabled: true }
  assert.equal(cosmeticCondition([], false), 'disabled')
  assert.equal(cosmeticCondition([lipstick], false), 'lipstick')
  assert.equal(cosmeticCondition([eyeliner], false), 'eyeliner')
  assert.equal(cosmeticCondition([concealer], false), 'concealer')
  assert.equal(cosmeticCondition([lipstick, eyeliner, concealer], false), 'all')
  assert.equal(cosmeticCondition([lipstick, eyeliner], false), 'mixed')
  assert.equal(cosmeticCondition([lipstick, eyeliner, concealer], true), 'disabled')
})

test('diagnostics retain bounded timing-only samples and compute FPS', () => {
  const diagnostics = new PerformanceDiagnostics({ sampleLimit: 20 })
  diagnostics.recordFrame(100)
  diagnostics.recordFrame(120)
  diagnostics.recordFrame(140)
  diagnostics.record('renderMs', 3, 'lipstick')
  diagnostics.record('renderMs', 5, 'lipstick')
  diagnostics.record('mediaPipeMs', 7, 'lipstick')
  diagnostics.record('segmentationMs', 30, 'lipstick')
  diagnostics.record('maskAgeMs', 80, 'lipstick')
  diagnostics.recordLongTask(55)

  const snapshot = diagnostics.snapshot({ now: 1140, memoryBytes: 12_345 })
  assert.equal(snapshot.privacy, 'timings-and-counts-only')
  assert.equal(snapshot.previewFps, 50)
  assert.equal(snapshot.elapsedMs, 1040)
  assert.equal(snapshot.usedHeapBytes, 12_345)
  assert.deepEqual(snapshot.conditions.lipstick.renderMs, { count: 2, average: 4, p95: 5 })
  assert.equal(snapshot.longTasks.count, 1)
  assert.equal(snapshot.longTasks.totalDuration, 55)
  assert.equal('landmarks' in snapshot, false)
  assert.equal('images' in snapshot, false)
})
