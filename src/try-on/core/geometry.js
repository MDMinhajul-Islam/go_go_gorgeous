export function computeLetterbox(sourceWidth, sourceHeight, targetWidth = 512, targetHeight = 512) {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) throw new RangeError('Dimensions must be positive')
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return { x: (targetWidth - width) / 2, y: (targetHeight - height) / 2, width, height, scale }
}

