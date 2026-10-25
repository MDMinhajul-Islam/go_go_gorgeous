export function computeLetterbox(sourceWidth, sourceHeight, targetWidth = 512, targetHeight = 512) {
  const dimensions = [sourceWidth, sourceHeight, targetWidth, targetHeight]
  if (!dimensions.every(dimension => Number.isFinite(dimension) && dimension > 0)) {
    throw new RangeError('Dimensions must be finite positive numbers')
  }
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return { x: (targetWidth - width) / 2, y: (targetHeight - height) / 2, width, height, scale }
}

