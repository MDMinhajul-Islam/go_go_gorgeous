export const LAYER_ORDER = ['concealer', 'eyeliner', 'lipstick']

export function createLayer(product, shade, intensity = 82) {
  if (!product || !shade) throw new TypeError('A product and shade are required')
  return {
    category: product.category,
    productId: product.id,
    variantId: shade.id,
    product,
    shade,
    intensity: Math.max(0, Math.min(100, Number(intensity) || 0)),
    enabled: true,
  }
}

export function upsertLookLayer(look, product, shade, intensity) {
  const previous = look[product.category]
  const layer = createLayer(product, shade, intensity ?? previous?.intensity ?? 82)
  return { ...look, [product.category]: layer }
}

export function updateLookLayer(look, category, changes) {
  const current = look[category]
  if (!current) return look
  return { ...look, [category]: { ...current, ...changes } }
}

export function toggleLookLayer(look, category) {
  const current = look[category]
  return current ? updateLookLayer(look, category, { enabled: !current.enabled }) : look
}

export function removeLookLayer(look, category) {
  if (!look[category]) return look
  const next = { ...look }
  delete next[category]
  return next
}

export function orderedLookLayers(look) {
  return Object.values(look).sort((a, b) => LAYER_ORDER.indexOf(a.category) - LAYER_ORDER.indexOf(b.category))
}

