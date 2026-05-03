import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('./public/icons', { recursive: true })

// Step 1: trim to actual content bounds, then add equal padding → perfect square
// This ensures the icon is truly centered regardless of original canvas offsets.
const trimmed = await sharp('./public/favicon.png')
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 10 })
  .png()
  .toBuffer()

const trimMeta = await sharp(trimmed).metadata()
const contentSize = Math.max(trimMeta.width, trimMeta.height)
// Add 6% padding on each side so the icon doesn't touch the edges
const pad = Math.round(contentSize * 0.06)
const side = contentSize + pad * 2

const squarePng = await sharp(trimmed)
  .extend({
    top:    Math.floor((side - trimMeta.height) / 2),
    bottom: Math.ceil((side - trimMeta.height) / 2),
    left:   Math.floor((side - trimMeta.width) / 2),
    right:  Math.ceil((side - trimMeta.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()

console.log(`content: ${trimMeta.width}x${trimMeta.height} → square: ${side}x${side} (pad=${pad}px each side)`)

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  await sharp(squarePng)
    .resize(size, size, { fit: 'fill' })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(`./public/icons/${name}`)
  console.log(`✓ public/icons/${name}`)
}

// Also update favicon.png itself to be square
await sharp(squarePng).toFile('./public/favicon.png')
console.log('✓ public/favicon.png (squared)')
