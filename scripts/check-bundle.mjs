import { readdir, stat } from 'node:fs/promises'

const directory = 'dist/assets'
const files = await readdir(directory)
const jsFiles = await Promise.all(files.filter(name => name.endsWith('.js')).map(async name => ({ name, size: (await stat(`${directory}/${name}`)).size })))
const initial = jsFiles.find(file => /^index-/.test(file.name))
const worker = jsFiles.find(file => /^faceParser\.worker-/.test(file.name))
const budgets = [{ file: initial, max: 225_000, label: 'initial JavaScript' }, { file: worker, max: 500_000, label: 'face parser worker' }]
for (const { file, max, label } of budgets) {
  if (!file) throw new Error(`Missing ${label} output`)
  console.log(`${label}: ${(file.size / 1024).toFixed(2)} KiB / ${(max / 1024).toFixed(2)} KiB budget`)
  if (file.size > max) throw new Error(`${label} exceeds bundle budget`)
}

