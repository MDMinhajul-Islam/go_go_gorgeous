import * as ort from 'onnxruntime-web'

const SIZE = 512
const MEAN = [0.485, 0.456, 0.406]
const STD = [0.229, 0.224, 0.225]

export const FACE_LABELS = { skin: 1, leftEye: 4, rightEye: 5, innerMouth: 11, upperLip: 12, lowerLip: 13 }

export class FaceParser {
  constructor() {
    this.session = null
    this.loading = null
    this.canvas = document.createElement('canvas')
    this.canvas.width = SIZE
    this.canvas.height = SIZE
  }

  async load() {
    if (this.session) return this.session
    if (this.loading) return this.loading
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1
    ort.env.wasm.simd = true
    this.loading = ort.InferenceSession.create('/models/face-parsing-resnet18.onnx', {
      executionProviders: ['wasm'], graphOptimizationLevel: 'all',
    }).then(session => (this.session = session))
    return this.loading
  }

  async parse(source, mirror = false) {
    const session = await this.load()
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    ctx.save()
    ctx.clearRect(0, 0, SIZE, SIZE)
    if (mirror) { ctx.translate(SIZE, 0); ctx.scale(-1, 1) }
    ctx.drawImage(source, 0, 0, SIZE, SIZE)
    ctx.restore()
    const rgba = ctx.getImageData(0, 0, SIZE, SIZE).data
    const plane = SIZE * SIZE
    const input = new Float32Array(plane * 3)
    for (let i = 0; i < plane; i++) {
      input[i] = (rgba[i * 4] / 255 - MEAN[0]) / STD[0]
      input[plane + i] = (rgba[i * 4 + 1] / 255 - MEAN[1]) / STD[1]
      input[plane * 2 + i] = (rgba[i * 4 + 2] / 255 - MEAN[2]) / STD[2]
    }
    const output = (await session.run({ input: new ort.Tensor('float32', input, [1, 3, SIZE, SIZE]) })).output
    const labels = new Uint8Array(plane)
    const classes = output.dims[1] || 19
    for (let pixel = 0; pixel < plane; pixel++) {
      let best = 0, score = -Infinity
      for (let cls = 0; cls < classes; cls++) {
        const candidate = output.data[cls * plane + pixel]
        if (candidate > score) { score = candidate; best = cls }
      }
      labels[pixel] = best
    }
    return { labels, width: SIZE, height: SIZE }
  }
}

export function createClassMask(segmentation, classIds, feather = 1) {
  if (!segmentation) return null
  const { labels, width, height } = segmentation
  const accepted = new Set(classIds)
  const hard = document.createElement('canvas')
  hard.width = width; hard.height = height
  const ctx = hard.getContext('2d')
  const image = ctx.createImageData(width, height)
  for (let i = 0; i < labels.length; i++) if (accepted.has(labels[i])) image.data[i * 4 + 3] = 255
  ctx.putImageData(image, 0, 0)
  if (!feather) return hard
  const soft = document.createElement('canvas')
  soft.width = width; soft.height = height
  const softCtx = soft.getContext('2d')
  softCtx.filter = `blur(${feather}px)`
  softCtx.drawImage(hard, 0, 0)
  return soft
}
