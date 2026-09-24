export const categories = [
  { id: 'lipstick', label: 'Lipstick', art: 'lip', tryOnStatus: 'supported' },
  { id: 'concealer', label: 'Concealer', art: 'concealer', tryOnStatus: 'beta' },
  { id: 'eyeliner', label: 'Eyeliner', art: 'liner', tryOnStatus: 'supported' },
]

const variants = (productId, finish, shades) => shades.map(([id, name, color]) => ({
  id: `${productId}-${id}`,
  name,
  color,
  n: name,
  c: color,
  finish,
}))

export const products = [
  { id: 'huda-power-bullet', category: 'lipstick', brand: 'HUDA BEAUTY', name: 'Power Bullet Matte Lipstick', price: 3850, rating: 4.9, art: 'lip', variants: variants('huda-power-bullet', 'matte', [['interview','Interview','#8e3544'],['pay-day','Pay Day','#a7525c'],['third-date','Third Date','#762a3e'],['board-meeting','Board Meeting','#9b493d']]) },
  { id: 'mac-maximal', category: 'lipstick', brand: 'MAC', name: 'M·A·Cximal Silky Matte Lipstick', price: 3450, oldPrice: 3750, rating: 4.8, art: 'lip', variants: variants('mac-maximal', 'satin', [['ruby-woo','Ruby Woo','#b0172c'],['velvet-teddy','Velvet Teddy','#9b594f'],['mehr','Mehr','#a95d68']]) },
  { id: 'elf-camo', category: 'concealer', brand: 'e.l.f.', name: 'Hydrating Camo Concealer 6mL', price: 1650, rating: 4.7, art: 'concealer', tryOnStatus: 'beta', variants: variants('elf-camo', 'natural', [['fair-beige','Fair Beige','#edc5a5'],['light-sand','Light Sand','#dba77e'],['medium-peach','Medium Peach','#c78c68'],['tan-walnut','Tan Walnut','#946043']]) },
  { id: 'maybelline-age-rewind', category: 'concealer', brand: 'MAYBELLINE', name: 'Instant Age Rewind Concealer', price: 1850, rating: 4.8, art: 'concealer', tryOnStatus: 'beta', variants: variants('maybelline-age-rewind', 'natural', [['ivory','Ivory','#efcdb1'],['sand','Sand','#d8a47f'],['caramel','Caramel','#b77a54']]) },
  { id: 'nyx-epic-ink', category: 'eyeliner', brand: 'NYX', name: 'Epic Ink Waterproof Liner', price: 1550, rating: 4.9, art: 'liner', variants: variants('nyx-epic-ink', 'winged', [['black','Black','#141316'],['brown','Brown','#432d28'],['plum','Plum','#3e2339']]) },
  { id: 'sheglam-color-liner', category: 'eyeliner', brand: 'SHEGLAM', name: 'All-In-One Color Eyeliner', price: 950, rating: 4.6, art: 'liner', variants: variants('sheglam-color-liner', 'classic', [['midnight','Midnight','#11141c'],['espresso','Espresso','#473128'],['ocean','Ocean','#183f61']]) },
]

// Temporary aliases keep the existing renderer readable while catalog data uses real SKU identifiers.
for (const product of products) product.shades = product.variants.map(({ id, name, color, finish }) => ({ id, n: name, c: color, finish }))

export const getProduct = productId => products.find(product => product.id === productId)
export const getVariant = (product, variantId) => product?.variants.find(variant => variant.id === variantId)
