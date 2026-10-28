const METRIC_NAMES = ['renderMs', 'mediaPipeMs', 'segmentationMs', 'maskAgeMs']

function finiteNonNegative(value) {
  return Number.isFinite(value) && value >= 0
}

export function percentile(values, fraction = 0.95) {
  const sorted = values.filter(finiteNonNegative).sort((a, b) => a - b)
  if (!sorted.length) return null
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))
  return sorted[index]
}

export function summarizeSamples(values) {
  const valid = values.filter(finiteNonNegative)
  if (!valid.length) return { count: 0, average: null, p95: null }
  return {
    count: valid.length,
    average: valid.reduce((total, value) => total + value, 0) / valid.length,
    p95: percentile(valid),
  }
}

export function cosmeticCondition(layers = [], showBefore = false) {
  if (showBefore) return 'disabled'
  const categories = [...new Set(layers.filter(layer => layer?.enabled !== false).map(layer => layer?.category).filter(Boolean))]
  if (!categories.length) return 'disabled'
  if (categories.length === 1 && ['lipstick', 'eyeliner', 'concealer'].includes(categories[0])) return categories[0]
  if (['lipstick', 'eyeliner', 'concealer'].every(category => categories.includes(category))) return 'all'
  return 'mixed'
}

export class PerformanceDiagnostics {
  constructor({ sampleLimit = 600 } = {}) {
    this.sampleLimit = Math.max(20, Math.floor(sampleLimit) || 600)
    this.reset()
  }

  reset() {
    this.conditions = new Map()
    this.frameIntervals = []
    this.lastFrameAt = null
    this.longTasks = []
    this.startedAt = null
  }

  start(now) {
    if (finiteNonNegative(now) && this.startedAt === null) this.startedAt = now
  }

  condition(name) {
    const key = typeof name === 'string' && name ? name : 'unknown'
    if (!this.conditions.has(key)) {
      this.conditions.set(key, Object.fromEntries(METRIC_NAMES.map(metric => [metric, []])))
    }
    return this.conditions.get(key)
  }

  record(metric, value, condition = 'unknown') {
    if (!METRIC_NAMES.includes(metric) || !finiteNonNegative(value)) return false
    const samples = this.condition(condition)[metric]
    samples.push(value)
    if (samples.length > this.sampleLimit) samples.splice(0, samples.length - this.sampleLimit)
    return true
  }

  recordFrame(now) {
    if (!finiteNonNegative(now)) return false
    this.start(now)
    if (this.lastFrameAt !== null) {
      const interval = now - this.lastFrameAt
      if (interval > 0 && interval <= 1000) {
        this.frameIntervals.push(interval)
        if (this.frameIntervals.length > this.sampleLimit) this.frameIntervals.shift()
      }
    }
    this.lastFrameAt = now
    return true
  }

  recordLongTask(duration) {
    if (!finiteNonNegative(duration)) return false
    this.longTasks.push(duration)
    if (this.longTasks.length > this.sampleLimit) this.longTasks.shift()
    return true
  }

  snapshot({ now = null, memoryBytes = null } = {}) {
    const frameSummary = summarizeSamples(this.frameIntervals)
    const conditionSummaries = {}
    for (const [name, metrics] of this.conditions) {
      conditionSummaries[name] = Object.fromEntries(
        METRIC_NAMES.map(metric => [metric, summarizeSamples(metrics[metric])]),
      )
    }
    const longTaskSummary = summarizeSamples(this.longTasks)
    return {
      privacy: 'timings-and-counts-only',
      elapsedMs: finiteNonNegative(now) && this.startedAt !== null ? Math.max(0, now - this.startedAt) : null,
      previewFps: frameSummary.average ? 1000 / frameSummary.average : null,
      frameIntervalMs: frameSummary,
      longTasks: {
        ...longTaskSummary,
        totalDuration: this.longTasks.reduce((total, value) => total + value, 0),
      },
      usedHeapBytes: finiteNonNegative(memoryBytes) ? memoryBytes : null,
      conditions: conditionSummaries,
    }
  }
}
