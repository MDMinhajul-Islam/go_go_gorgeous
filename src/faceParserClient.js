export const FACE_LABELS = { skin: 1, leftEye: 4, rightEye: 5, innerMouth: 11, upperLip: 12, lowerLip: 13 }

export function createClassMask(segmentation, classIds, feather = 1) {
  if (!segmentation) return null
  const { labels, width, height, content = { x: 0, y: 0, width, height } } = segmentation
  const accepted = new Set(classIds)
  const hard = document.createElement('canvas')
  hard.width = width; hard.height = height
  const ctx = hard.getContext('2d')
  const image = ctx.createImageData(width, height)
  for (let i = 0; i < labels.length; i++) if (accepted.has(labels[i])) image.data[i * 4 + 3] = 255
  ctx.putImageData(image, 0, 0)
  const crop = canvas => {
    const result = document.createElement('canvas')
    result.width = Math.max(1, Math.round(content.width)); result.height = Math.max(1, Math.round(content.height))
    result.getContext('2d').drawImage(canvas, content.x, content.y, content.width, content.height, 0, 0, result.width, result.height)
    return result
  }
  if (!feather) return crop(hard)
  const soft = document.createElement('canvas')
  soft.width = width; soft.height = height
  const softCtx = soft.getContext('2d')
  softCtx.filter = `blur(${feather}px)`
  softCtx.drawImage(hard, 0, 0)
  return crop(soft)
}

export class FaceParser {
  constructor() {
    this.nextId = 1
    this.pending = new Map()
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
      this.worker = null
      this.fallback = import('./faceParser.js').then(module => new module.FaceParser())
      return
    }
    this.worker = new Worker(new URL('./faceParser.worker.js', import.meta.url), { type: 'module', name: 'face-parser' })
    this.worker.onmessage = event => {
      const request = this.pending.get(event.data.id)
      if (!request) return
      this.pending.delete(event.data.id)
      event.data.error ? request.reject(new Error(event.data.error)) : request.resolve(event.data.result)
    }
    this.worker.onerror = error => {
      for (const request of this.pending.values()) request.reject(error)
      this.pending.clear()
    }
  }

  async parse(source, mirror = false) {
    if (!this.worker) return (await this.fallback).parse(source, mirror)
    const bitmap = await createImageBitmap(source)
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.worker.postMessage({ id, bitmap, mirror }, [bitmap])
    })
  }

  close() {
    this.worker?.terminate()
    for (const request of this.pending.values()) request.reject(new Error('Face parser closed'))
    this.pending.clear()
  }
}
