import test from 'node:test'
import assert from 'node:assert/strict'
import { products } from '../src/catalog/catalog.js'
import { createLayer, orderedLookLayers, removeLookLayer, toggleLookLayer, updateLookLayer, upsertLookLayer } from '../src/try-on/state/lookState.js'

const lipstick = products.find(product => product.category === 'lipstick')
const eyeliner = products.find(product => product.category === 'eyeliner')
const concealer = products.find(product => product.category === 'concealer')

test('different cosmetic categories coexist', () => {
  let look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  look = upsertLookLayer(look, eyeliner, eyeliner.shades[0])
  assert.deepEqual(Object.keys(look).sort(), ['eyeliner', 'lipstick'])
})

test('replacing lipstick does not remove eyeliner', () => {
  let look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  look = upsertLookLayer(look, eyeliner, eyeliner.shades[0])
  const secondLipstick = products.filter(product => product.category === 'lipstick')[1]
  look = upsertLookLayer(look, secondLipstick, secondLipstick.shades[1])
  assert.equal(look.lipstick.productId, secondLipstick.id)
  assert.equal(look.eyeliner.productId, eyeliner.id)
})

test('layer creation rejects mismatched product and shade identities', () => {
  assert.throws(() => createLayer(lipstick, eyeliner.shades[0]), /does not belong/)
  assert.throws(() => createLayer({ ...lipstick, category: 'foundation' }, lipstick.shades[0]), /Unsupported/)
})

test('layers toggle, update and remove independently', () => {
  let look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  look = toggleLookLayer(look, 'lipstick')
  look = updateLookLayer(look, 'lipstick', { intensity: 43 })
  assert.equal(look.lipstick.enabled, false)
  assert.equal(look.lipstick.intensity, 43)
  assert.deepEqual(removeLookLayer(look, 'lipstick'), {})
})

test('layer intensity is finite and clamped to renderer boundaries', () => {
  assert.equal(createLayer(lipstick, lipstick.shades[0], -1).intensity, 0)
  assert.equal(createLayer(lipstick, lipstick.shades[0], 150).intensity, 100)
  assert.equal(createLayer(lipstick, lipstick.shades[0], Number.NaN).intensity, 0)
  const look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  assert.equal(updateLookLayer(look, 'lipstick', { intensity: Number.POSITIVE_INFINITY }).lipstick.intensity, 0)
})

test('layer updates cannot overwrite category or SKU identity', () => {
  const look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  const updated = updateLookLayer(look, 'lipstick', {
    category: 'eyeliner',
    productId: eyeliner.id,
    variantId: eyeliner.shades[0].id,
    product: eyeliner,
    shade: eyeliner.shades[0],
  })
  assert.equal(updated, look)
  assert.equal(updated.lipstick.productId, lipstick.id)
  assert.equal(updated.lipstick.variantId, lipstick.shades[0].id)
})

test('render order is deterministic', () => {
  let look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  look = upsertLookLayer(look, concealer, concealer.shades[0])
  look = upsertLookLayer(look, eyeliner, eyeliner.shades[0])
  assert.deepEqual(orderedLookLayers(look).map(layer => layer.category), ['concealer', 'eyeliner', 'lipstick'])
})

test('render order excludes unknown and mis-keyed layers', () => {
  const look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  assert.deepEqual(orderedLookLayers({
    ...look,
    foundation: { ...look.lipstick, category: 'foundation' },
    eyeliner: { ...look.lipstick },
  }).map(layer => layer.category), ['lipstick'])
  assert.deepEqual(orderedLookLayers(null), [])
})
