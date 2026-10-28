export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

export function uploadValidationError(file) {
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/') || !Number.isFinite(file.size) || file.size < 0 || file.size > MAX_UPLOAD_BYTES) {
    return 'Choose a valid image smaller than 12 MB.'
  }
  return ''
}
