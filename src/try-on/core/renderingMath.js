const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const RENDER_ANCHORS = Object.freeze([33, 133, 263, 362, 61, 291, 13, 14])

export function lipstickProfile(finish = 'matte', intensity = 82) {
  const amount = clamp(Number(intensity) / 100 || 0, 0, 1)
  return finish === 'satin'
    ? { coverageAlpha: .32 * amount, colorAlpha: .64 * amount, multiplyAlpha: .12 * amount, highlightAlpha: .08 * amount, featherScale: 1.1 }
    : { coverageAlpha: .36 * amount, colorAlpha: .6 * amount, multiplyAlpha: .24 * amount, highlightAlpha: .02 * amount, featherScale: .9 }
}

export function adaptiveFeatherPixels(faceWidthPixels, qualityTier = 'high') {
  const qualityScale = qualityTier === 'low' ? .82 : qualityTier === 'medium' ? .92 : 1
  return clamp(faceWidthPixels * .0065 * qualityScale, .7, 3.2)
}

export function captureRenderAnchors(landmarks) {
  if (!Array.isArray(landmarks)) return null
  const anchors = RENDER_ANCHORS.map(index => landmarks[index]).filter(Boolean)
  return anchors.length === RENDER_ANCHORS.length
    ? anchors.map(({ x, y, z = 0 }) => ({ x, y, z }))
    : null
}

export function landmarkDrift(previousAnchors, landmarks) {
  const current = captureRenderAnchors(landmarks)
  if (!previousAnchors || !current || previousAnchors.length !== current.length) return Number.POSITIVE_INFINITY
  return previousAnchors.reduce((sum, point, index) => {
    const next = current[index]
    return sum + Math.hypot(next.x - point.x, next.y - point.y)
  }, 0) / previousAnchors.length
}

export function isSegmentationCompatible(segmentation, landmarks, maxMeanDrift = .026) {
  return Boolean(segmentation?.anchors) && landmarkDrift(segmentation.anchors, landmarks) <= maxMeanDrift
}

export function segmentationAlignment(segmentation, landmarks, width, height) {
  const previous = segmentation?.anchors
  const current = captureRenderAnchors(landmarks)
  if (!previous || !current || previous.length !== current.length) return null
  const center = points => points.reduce((total, point) => ({ x: total.x + point.x, y: total.y + point.y }), { x: 0, y: 0 })
  const from = center(previous), to = center(current)
  from.x /= previous.length; from.y /= previous.length; to.x /= current.length; to.y /= current.length
  const vector = points => ({ x: points[2].x - points[0].x, y: points[2].y - points[0].y })
  const oldAxis = vector(previous), newAxis = vector(current)
  const oldLength = Math.hypot(oldAxis.x, oldAxis.y), newLength = Math.hypot(newAxis.x, newAxis.y)
  const scale = oldLength > 0 ? clamp(newLength / oldLength, .94, 1.06) : 1
  const rotation = clamp(Math.atan2(newAxis.y, newAxis.x) - Math.atan2(oldAxis.y, oldAxis.x), -.08, .08)
  return {
    from: { x: from.x * width, y: from.y * height },
    to: { x: to.x * width, y: to.y * height },
    scale,
    rotation,
  }
}

export function smoothLandmarks(previous, detected) {
  if (!previous || previous.length !== detected?.length) return detected
  return detected.map((point, index) => {
    const prior = previous[index]
    const motion = Math.hypot(point.x - prior.x, point.y - prior.y)
    const follow = clamp(.18 + motion * 46, .18, .9)
    return {
      x: prior.x * (1 - follow) + point.x * follow,
      y: prior.y * (1 - follow) + point.y * follow,
      z: (prior.z || 0) * (1 - follow) + (point.z || 0) * follow,
    }
  })
}

export function eyeStrokeGeometry(landmarks, spec, width, height, intensity = 1) {
  const points = spec.upper.map(index => landmarks[index]).filter(Boolean)
  const outer = points[0], inner = points.at(-1)
  const top = landmarks[spec.top], bottom = landmarks[spec.bottom]
  if (points.length !== spec.upper.length || !outer || !inner || !top || !bottom) return null
  const dx = (outer.x - inner.x) * width, dy = (outer.y - inner.y) * height
  const eyeWidth = Math.hypot(dx, dy)
  if (eyeWidth < 2) return null
  const openness = Math.hypot((top.x - bottom.x) * width, (top.y - bottom.y) * height) / eyeWidth
  const blinkAlpha = clamp((openness - .028) / .075, 0, 1)
  if (blinkAlpha <= .02) return null
  const amount = clamp(intensity, 0, 1)
  const baseWidth = clamp(eyeWidth * .052, 1.45, 6.2) * (.76 + amount * .24)
  const segments = points.slice(0, -1).map((point, index) => ({
    from: { x: point.x * width, y: point.y * height },
    to: { x: points[index + 1].x * width, y: points[index + 1].y * height },
    width: baseWidth * (1 - index / Math.max(1, points.length - 1) * .58),
  }))
  const axisX = dx / eyeWidth, axisY = dy / eyeWidth
  let normalX = axisY, normalY = -axisX
  if (normalY > 0) { normalX *= -1; normalY *= -1 }
  const perspective = clamp(1 - Math.abs((outer.z || 0) - (inner.z || 0)) * 2.4, .62, 1)
  const wingLength = eyeWidth * .27 * perspective
  const wingStart = { x: outer.x * width, y: outer.y * height }
  const wingTip = {
    x: wingStart.x + axisX * wingLength + normalX * wingLength * .36,
    y: wingStart.y + axisY * wingLength + normalY * wingLength * .36,
  }
  return { segments, wingStart, wingTip, wingWidth: baseWidth * .72, alpha: blinkAlpha * (.74 + amount * .26) }
}

export function concealerRegion(landmarks, [outerId, innerId, cheekId], width, height) {
  const outer = landmarks[outerId], inner = landmarks[innerId], cheek = landmarks[cheekId]
  if (!outer || !inner || !cheek) return null
  const outerPoint = { x: outer.x * width, y: outer.y * height }
  const innerPoint = { x: inner.x * width, y: inner.y * height }
  const cheekPoint = { x: cheek.x * width, y: cheek.y * height }
  const eyeWidth = Math.hypot(innerPoint.x - outerPoint.x, innerPoint.y - outerPoint.y)
  if (eyeWidth < 2) return null
  const midpoint = { x: (outerPoint.x + innerPoint.x) / 2, y: (outerPoint.y + innerPoint.y) / 2 }
  return {
    center: { x: midpoint.x * .72 + cheekPoint.x * .28, y: midpoint.y * .72 + cheekPoint.y * .28 },
    radiusX: eyeWidth * .64,
    radiusY: eyeWidth * .28,
    rotation: Math.atan2(innerPoint.y - outerPoint.y, innerPoint.x - outerPoint.x),
  }
}

export function illuminationOpacity(red, green, blue) {
  const luminance = (.2126 * red + .7152 * green + .0722 * blue) / 255
  return clamp(.74 + Math.abs(luminance - .5) * .34, .74, .91)
}
