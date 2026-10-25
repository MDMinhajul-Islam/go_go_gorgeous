import test from 'node:test'
import assert from 'node:assert/strict'
import { cartReducer, sanitizeCart } from '../src/cart/cart.js'
import { products } from '../src/catalog/catalog.js'

const product = products[0]
const variant = product.variants[0]

test('cart merges the same SKU and preserves a different shade', () => {
  let state = cartReducer([], { type: 'add', productId: product.id, variantId: variant.id, quantity: 1 })
  state = cartReducer(state, { type: 'add', productId: product.id, variantId: variant.id, quantity: 2 })
  state = cartReducer(state, { type: 'add', productId: product.id, variantId: product.variants[1].id, quantity: 1 })
  assert.equal(state.length, 2)
  assert.equal(state[0].quantity, 3)
})

test('persisted invalid or discontinued SKUs are discarded', () => {
  assert.deepEqual(sanitizeCart([{ productId: 'missing', variantId: 'missing', quantity: 8 }]), [])
})

test('cart quantities reject malformed values and stay within supported bounds', () => {
  const item = quantity => ({ productId: product.id, variantId: variant.id, quantity })
  assert.equal(sanitizeCart([item('2items')])[0].quantity, 1)
  assert.equal(sanitizeCart([item(Number.POSITIVE_INFINITY)])[0].quantity, 1)
  assert.equal(sanitizeCart([item(-4)])[0].quantity, 1)
  assert.equal(sanitizeCart([item(2.9)])[0].quantity, 2)
  assert.equal(sanitizeCart([item(1000)])[0].quantity, 99)
})

test('malformed quantity updates remove the matching SKU', () => {
  const state = [{ productId: product.id, variantId: variant.id, quantity: 2 }]
  assert.deepEqual(cartReducer(state, { type: 'quantity', productId: product.id, variantId: variant.id, quantity: '2items' }), [])
})

test('quantity zero removes an item', () => {
  const state = [{ productId: product.id, variantId: variant.id, quantity: 1 }]
  assert.deepEqual(cartReducer(state, { type: 'quantity', productId: product.id, variantId: variant.id, quantity: 0 }), [])
})
