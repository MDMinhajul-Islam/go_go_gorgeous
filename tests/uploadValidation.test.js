import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_UPLOAD_BYTES, uploadValidationError } from '../src/try-on/core/uploadValidation.js'

test('upload validation accepts bounded image files', () => {
  assert.equal(uploadValidationError({ type: 'image/png', size: 2_118_658 }), '')
  assert.equal(uploadValidationError({ type: 'image/jpeg', size: MAX_UPLOAD_BYTES }), '')
})

test('upload validation rejects absent, non-image, oversized and malformed files', () => {
  const message = 'Choose a valid image smaller than 12 MB.'
  assert.equal(uploadValidationError(), message)
  assert.equal(uploadValidationError({ type: 'text/plain', size: 20 }), message)
  assert.equal(uploadValidationError({ type: 'image/png', size: MAX_UPLOAD_BYTES + 1 }), message)
  assert.equal(uploadValidationError({ type: 'image/png', size: Number.NaN }), message)
  assert.equal(uploadValidationError({ type: 'image/png', size: -1 }), message)
})
