import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const fixturesDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

test('visual-validation fixtures match their recorded provenance checksums', async () => {
  const manifest = JSON.parse(await readFile(path.join(fixturesDirectory, 'manifest.json'), 'utf8'))
  assert.equal(manifest.version, 1)
  assert.ok(manifest.fixtures.length > 0)

  for (const fixture of manifest.fixtures) {
    assert.match(fixture.sha256, /^[A-F0-9]{64}$/)
    assert.match(fixture.subject, /Fictional adult/)
    const contents = await readFile(path.join(fixturesDirectory, fixture.file))
    const digest = createHash('sha256').update(contents).digest('hex').toUpperCase()
    assert.equal(digest, fixture.sha256, `${fixture.id} changed without a provenance update`)
  }
})
