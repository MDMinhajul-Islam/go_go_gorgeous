export function createClassAlpha(labels, includedClassIds, excludedClassIds = []) {
  if (!(labels instanceof Uint8Array) && !(labels instanceof Uint8ClampedArray)) {
    throw new TypeError('Segmentation labels must be an unsigned byte array')
  }
  const included = new Set(includedClassIds)
  const excluded = new Set(excludedClassIds)
  const alpha = new Uint8ClampedArray(labels.length)
  for (let index = 0; index < labels.length; index++) {
    if (included.has(labels[index]) && !excluded.has(labels[index])) alpha[index] = 255
  }
  return alpha
}

export function writeAlphaChannel(imageData, alpha) {
  if (imageData.data.length !== alpha.length * 4) throw new RangeError('Alpha dimensions do not match image data')
  for (let index = 0; index < alpha.length; index++) imageData.data[index * 4 + 3] = alpha[index]
  return imageData
}
