import { FaceParser } from './faceParser.js'

const parser = new FaceParser()

self.onmessage = async event => {
  const { id, bitmap, mirror } = event.data
  try {
    const result = await parser.parse(bitmap, mirror)
    bitmap.close()
    self.postMessage({ id, result }, [result.labels.buffer])
  } catch (error) {
    bitmap.close()
    self.postMessage({ id, error: error instanceof Error ? error.message : 'Face parsing failed' })
  }
}

