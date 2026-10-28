import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('storefront shell has no third-party runtime font connection', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/i)
  assert.doesNotMatch(html, /<(?:script|link)[^>]+https?:\/\//i)
})
