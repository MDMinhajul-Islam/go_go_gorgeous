import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const expected = new Map([
  ['public/models/face-parsing-resnet18.onnx', '0d9bd318e46987c3bdbfacae9e2c0f461cae1c6ac6ea6d43bbe541a91727e33f'],
  ['public/models/mediapipe/face_landmarker.task', '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff'],
])

for (const [path, wanted] of expected) {
  const actual = createHash('sha256').update(await readFile(path)).digest('hex')
  if (actual !== wanted) throw new Error(`${path} integrity mismatch: ${actual}`)
  console.log(`verified ${path}`)
}

