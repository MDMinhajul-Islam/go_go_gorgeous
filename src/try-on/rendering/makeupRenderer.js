import {
  adaptiveFeatherPixels, concealerRegion, eyeStrokeGeometry, illuminationOpacity, lipstickProfile,
  segmentationAlignment,
} from '../core/renderingMath.js'

const LIP_OUTER = [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146]
const LIP_INNER = [78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95]
const EYES = [
  { upper: [33,246,161,160,159,158,157,173,133], top: 159, bottom: 145 },
  { upper: [263,466,388,387,386,385,384,398,362], top: 386, bottom: 374 },
]
const UNDER_EYES = [[33,133,118], [263,362,347]]

function colorWithAlpha(hex, alpha) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.split('').map(part => part + part).join('') : value
  const number = Number.parseInt(normalized, 16)
  return `rgba(${number >> 16},${number >> 8 & 255},${number & 255},${alpha})`
}

export class MakeupRenderer {
  constructor(createCanvas = () => document.createElement('canvas')) {
    this.createCanvas = createCanvas
    this.buffers = new Map()
    this.masks = new Map()
    this.segmentation = null
    this.faceModule = null
    this.segmentationVersion = 0
  }

  setSegmentation(segmentation, faceModule, version) {
    if (version === this.segmentationVersion && segmentation === this.segmentation) return
    this.segmentation = segmentation
    this.faceModule = faceModule
    this.segmentationVersion = version
    this.masks.clear()
  }

  clearSegmentation() {
    this.segmentation = null
    this.segmentationVersion++
    this.masks.clear()
  }

  buffer(name, width, height) {
    let canvas = this.buffers.get(name)
    if (!canvas) { canvas = this.createCanvas(); this.buffers.set(name, canvas) }
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.filter = 'none'
    return { canvas, ctx }
  }

  mask(classIds, feather, excludedClassIds = []) {
    if (!this.segmentation || !this.faceModule) return null
    const key = `${this.segmentationVersion}:${classIds.join('-')}:${excludedClassIds.join('-')}:${feather.toFixed(2)}`
    if (!this.masks.has(key)) {
      this.masks.set(key, this.faceModule.createClassMask(this.segmentation, classIds, feather, excludedClassIds))
    }
    return this.masks.get(key)
  }

  paintMaskedColor(ctx, mask, color, alpha, width, height, blend) {
    if (!mask || alpha <= 0) return
    const { canvas, ctx: layer } = this.buffer('masked-color', mask.width, mask.height)
    layer.drawImage(mask, 0, 0)
    layer.globalCompositeOperation = 'source-in'
    layer.fillStyle = color
    layer.fillRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.globalCompositeOperation = blend
    ctx.globalAlpha = alpha
    this.drawAligned(ctx, canvas, width, height)
    ctx.restore()
  }

  drawAligned(ctx, canvas, width, height) {
    const alignment = this.currentAlignment
    if (!alignment) { ctx.drawImage(canvas, 0, 0, width, height); return }
    ctx.translate(alignment.to.x, alignment.to.y)
    ctx.rotate(alignment.rotation)
    ctx.scale(alignment.scale, alignment.scale)
    ctx.translate(-alignment.from.x, -alignment.from.y)
    ctx.drawImage(canvas, 0, 0, width, height)
  }

  drawLipFallback(ctx, landmarks, width, height, shade, profile) {
    const path = () => {
      ctx.beginPath()
      for (const ring of [LIP_OUTER, LIP_INNER]) {
        ring.forEach((index, pointIndex) => {
          const point = landmarks[index]
          if (!point) return
          if (pointIndex) ctx.lineTo(point.x * width, point.y * height)
          else ctx.moveTo(point.x * width, point.y * height)
        })
        ctx.closePath()
      }
    }
    ctx.save()
    ctx.filter = `blur(${adaptiveFeatherPixels(Math.abs(landmarks[291].x - landmarks[61].x) * width)}px)`
    ctx.fillStyle = shade
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = profile.multiplyAlpha
    path(); ctx.fill('evenodd')
    ctx.globalCompositeOperation = 'color'
    ctx.globalAlpha = profile.colorAlpha
    path(); ctx.fill('evenodd')
    ctx.restore()
  }

  drawLipstick(ctx, landmarks, width, height, product, shade, intensity, qualityTier) {
    const profile = lipstickProfile(shade.finish || product.variants?.find(item => item.id === shade.id)?.finish, intensity)
    const labels = this.faceModule?.FACE_LABELS
    const faceWidth = Math.abs((landmarks[454]?.x || 0) - (landmarks[234]?.x || 0)) * width
    const feather = adaptiveFeatherPixels(faceWidth, qualityTier) * profile.featherScale
    const mask = labels && this.mask([labels.upperLip, labels.lowerLip], feather, [labels.innerMouth])
    if (!mask) return this.drawLipFallback(ctx, landmarks, width, height, shade.c, profile)
    this.paintMaskedColor(ctx, mask, shade.c, profile.multiplyAlpha, width, height, 'multiply')
    this.paintMaskedColor(ctx, mask, shade.c, profile.colorAlpha, width, height, 'color')
    if (profile.highlightAlpha > 0) {
      const { canvas, ctx: highlight } = this.buffer('lip-highlight', mask.width, mask.height)
      const gradient = highlight.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(255,255,255,0)')
      gradient.addColorStop(.38, 'rgba(255,255,255,.58)')
      gradient.addColorStop(.62, 'rgba(255,255,255,.16)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      highlight.fillStyle = gradient; highlight.fillRect(0, 0, canvas.width, canvas.height)
      highlight.globalCompositeOperation = 'destination-in'; highlight.drawImage(mask, 0, 0)
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = profile.highlightAlpha
      this.drawAligned(ctx, canvas, width, height); ctx.restore()
    }
  }

  drawEyeliner(ctx, landmarks, width, height, shade, intensity) {
    ctx.save(); ctx.strokeStyle = shade.c; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    for (const spec of EYES) {
      const geometry = eyeStrokeGeometry(landmarks, spec, width, height, intensity / 100)
      if (!geometry) continue
      ctx.globalAlpha = geometry.alpha
      for (const segment of geometry.segments) {
        ctx.lineWidth = segment.width; ctx.beginPath()
        ctx.moveTo(segment.from.x, segment.from.y); ctx.lineTo(segment.to.x, segment.to.y); ctx.stroke()
      }
      ctx.lineWidth = geometry.wingWidth; ctx.beginPath()
      ctx.moveTo(geometry.wingStart.x, geometry.wingStart.y)
      ctx.quadraticCurveTo(
        (geometry.wingStart.x + geometry.wingTip.x) / 2,
        geometry.wingTip.y + geometry.wingWidth,
        geometry.wingTip.x, geometry.wingTip.y,
      ); ctx.stroke()
    }
    ctx.restore()
  }

  sampleIllumination(ctx, region) {
    try {
      const x = Math.max(0, Math.round(region.center.x - 2)), y = Math.max(0, Math.round(region.center.y - 2))
      const data = ctx.getImageData(x, y, 5, 5).data
      let red = 0, green = 0, blue = 0, count = 0
      for (let index = 0; index < data.length; index += 4) { red += data[index]; green += data[index + 1]; blue += data[index + 2]; count++ }
      return illuminationOpacity(red / count, green / count, blue / count)
    } catch { return .82 }
  }

  drawConcealer(ctx, landmarks, width, height, shade, intensity) {
    const { canvas, ctx: layer } = this.buffer('concealer', width, height)
    const amount = Math.max(0, Math.min(1, intensity / 100))
    for (const spec of UNDER_EYES) {
      const region = concealerRegion(landmarks, spec, width, height)
      if (!region) continue
      const illumination = this.sampleIllumination(ctx, region)
      layer.save(); layer.translate(region.center.x, region.center.y); layer.rotate(region.rotation)
      layer.scale(1, region.radiusY / region.radiusX)
      const gradient = layer.createRadialGradient(0, 0, region.radiusX * .08, 0, 0, region.radiusX)
      gradient.addColorStop(0, colorWithAlpha(shade.c, .6 * illumination))
      gradient.addColorStop(.45, colorWithAlpha(shade.c, .34 * illumination))
      gradient.addColorStop(.78, colorWithAlpha(shade.c, .12 * illumination))
      gradient.addColorStop(1, colorWithAlpha(shade.c, 0))
      layer.fillStyle = gradient; layer.beginPath(); layer.arc(0, 0, region.radiusX, 0, Math.PI * 2); layer.fill(); layer.restore()
    }
    const labels = this.faceModule?.FACE_LABELS
    const skinMask = labels && this.mask([labels.skin], 1.5)
    if (skinMask) { layer.globalCompositeOperation = 'destination-in'; layer.save(); this.drawAligned(layer, skinMask, width, height); layer.restore() }
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .42 + amount * .28; ctx.drawImage(canvas, 0, 0)
    ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = .08 + amount * .1; ctx.drawImage(canvas, 0, 0); ctx.restore()
  }

  render(ctx, landmarks, width, height, layers, { qualityTier = 'high', debugMask = false } = {}) {
    if (!landmarks) return
    this.currentAlignment = segmentationAlignment(this.segmentation, landmarks, width, height)
    for (const layer of layers) {
      if (!layer.enabled) continue
      const { product, shade, intensity } = layer
      if (product.category === 'concealer') this.drawConcealer(ctx, landmarks, width, height, shade, intensity)
      if (product.category === 'eyeliner') this.drawEyeliner(ctx, landmarks, width, height, shade, intensity)
      if (product.category === 'lipstick') this.drawLipstick(ctx, landmarks, width, height, product, shade, intensity, qualityTier)
    }
    if (debugMask && this.faceModule && this.segmentation) {
      const labels = this.faceModule.FACE_LABELS
      const mask = this.mask([labels.skin, labels.upperLip, labels.lowerLip, labels.leftEye, labels.rightEye], 0)
      if (mask) { ctx.save(); ctx.globalAlpha = .26; this.drawAligned(ctx, mask, width, height); ctx.restore() }
    }
    this.currentAlignment = null
  }
}
