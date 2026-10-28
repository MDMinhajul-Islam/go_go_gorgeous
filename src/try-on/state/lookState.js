export const LAYER_ORDER = ['concealer', 'eyeliner', 'lipstick']

function normalizeIntensity(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0
}

export function createLayer(product, shade, intensity = 82) {
  if (!product || !shade) throw new TypeError('A product and shade are required')
  if (!LAYER_ORDER.includes(product.category)) throw new RangeError('Unsupported cosmetic category')
  if (!product.variants?.some(variant => variant.id === shade.id)) throw new RangeError('Shade does not belong to product')
  return {
    category: product.category,
    productId: product.id,
    variantId: shade.id,
    product,
    shade,
    intensity: normalizeIntensity(intensity),
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
  const next = { ...current }
  let changed = false
  if (Object.hasOwn(changes ?? {}, 'intensity')) {
    next.intensity = normalizeIntensity(changes.intensity)
    changed = true
  }
  if (typeof changes?.enabled === 'boolean') {
    next.enabled = changes.enabled
    changed = true
  }
  return changed ? { ...look, [category]: next } : look
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
  return LAYER_ORDER.flatMap(category => look?.[category]?.category === category ? [look[category]] : [])
}

