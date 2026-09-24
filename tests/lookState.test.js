import test from 'node:test'
import assert from 'node:assert/strict'
import { products } from '../src/catalog/catalog.js'
import { orderedLookLayers, removeLookLayer, toggleLookLayer, updateLookLayer, upsertLookLayer } from '../src/try-on/state/lookState.js'

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

test('layers toggle, update and remove independently', () => {
  let look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  look = toggleLookLayer(look, 'lipstick')
  look = updateLookLayer(look, 'lipstick', { intensity: 43 })
  assert.equal(look.lipstick.enabled, false)
  assert.equal(look.lipstick.intensity, 43)
  assert.deepEqual(removeLookLayer(look, 'lipstick'), {})
})

test('render order is deterministic', () => {
  let look = upsertLookLayer({}, lipstick, lipstick.shades[0])
  look = upsertLookLayer(look, concealer, concealer.shades[0])
  look = upsertLookLayer(look, eyeliner, eyeliner.shades[0])
  assert.deepEqual(orderedLookLayers(look).map(layer => layer.category), ['concealer', 'eyeliner', 'lipstick'])
})
