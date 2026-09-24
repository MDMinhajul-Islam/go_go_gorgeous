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

test('quantity zero removes an item', () => {
  const state = [{ productId: product.id, variantId: variant.id, quantity: 1 }]
  assert.deepEqual(cartReducer(state, { type: 'quantity', productId: product.id, variantId: variant.id, quantity: 0 }), [])
})
