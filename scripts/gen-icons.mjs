import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'

const svg = readFileSync('./public/favicon.svg')
mkdirSync('./public/icons', { recursive: true })

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`./public/icons/${name}`)
  console.log(`✓ public/icons/${name}`)
}
