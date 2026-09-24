import { getProduct, getVariant } from '../catalog/catalog.js'

export const CART_STORAGE_KEY = 'go-go-gorgeous:cart:v1'

export function sanitizeCart(value) {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    const product = getProduct(item?.productId)
    const variant = getVariant(product, item?.variantId)
    const quantity = Math.max(1, Math.min(99, Number.parseInt(item?.quantity, 10) || 1))
    return product && variant ? [{ productId: product.id, variantId: variant.id, quantity }] : []
  })
}

export function loadCart(storage = globalThis.localStorage) {
  try { return sanitizeCart(JSON.parse(storage?.getItem(CART_STORAGE_KEY) || '[]')) } catch { return [] }
}

export function saveCart(items, storage = globalThis.localStorage) {
  try { storage?.setItem(CART_STORAGE_KEY, JSON.stringify(sanitizeCart(items))) } catch { /* storage may be unavailable */ }
}

export function cartReducer(state, action) {
  if (action.type === 'add') {
    const valid = sanitizeCart([{ productId: action.productId, variantId: action.variantId, quantity: action.quantity }])[0]
    if (!valid) return state
    const index = state.findIndex(item => item.productId === valid.productId && item.variantId === valid.variantId)
    if (index < 0) return [...state, valid]
    return state.map((item, i) => i === index ? { ...item, quantity: Math.min(99, item.quantity + valid.quantity) } : item)
  }
  if (action.type === 'quantity') return state.flatMap(item => {
    if (item.productId !== action.productId || item.variantId !== action.variantId) return [item]
    const quantity = Math.max(0, Math.min(99, Number.parseInt(action.quantity, 10) || 0))
    return quantity ? [{ ...item, quantity }] : []
  })
  if (action.type === 'remove') return state.filter(item => item.productId !== action.productId || item.variantId !== action.variantId)
  return state
}

export const cartCount = items => items.reduce((total, item) => total + item.quantity, 0)

