const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')

async function verifyProductionAssets() {
  const dist = path.resolve(__dirname, '../dist')
  const checked = new Set()
  async function verifyFile(asset) {
    const relativePath = decodeURIComponent(asset.split(/[?#]/)[0]).replace(/^\//, '')
    const resolved = path.resolve(dist, relativePath)
    assert.ok(resolved.startsWith(`${dist}${path.sep}`), `Asset escapes dist: ${asset}`)
    assert.ok((await fs.stat(resolved)).isFile(), `Missing production asset: ${asset}`)
    checked.add(relativePath)
    return fs.readFile(resolved)
  }

  const html = (await verifyFile('index.html')).toString()
  assert.ok(html.includes('lang="vi"'))
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])
  assert.ok(references.includes('/manifest.webmanifest'), 'Missing linked manifest')
  for (const asset of references) {
    assert.ok(!/^https?:/.test(asset), `Unexpected external app-shell asset: ${asset}`)
    await verifyFile(asset)
  }

  const manifest = JSON.parse((await verifyFile('manifest.webmanifest')).toString())
  assert.equal(manifest.name, 'MƯU SINH – Mỗi Ngày Một Nghề')
  assert.equal(manifest.short_name, 'MƯU SINH')
  assert.equal(manifest.lang, 'vi')
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.start_url, '/')
  assert.equal(manifest.scope, '/')
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'))
  for (const icon of manifest.icons) {
    const bytes = await verifyFile(icon.src)
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    const [width, height] = icon.sizes.split('x').map(Number)
    assert.equal(bytes.readUInt32BE(16), width)
    assert.equal(bytes.readUInt32BE(20), height)
  }

  const worker = (await verifyFile('sw.js')).toString()
  assert.ok(worker.includes('precacheAndRoute'), 'Missing service-worker precache')
  const precacheAssets = [...worker.matchAll(/url:"([^"]+)"/g)].map((match) => match[1])
  assert.ok(precacheAssets.includes('index.html'), 'App shell is not precached')
  assert.ok(precacheAssets.includes('manifest.webmanifest'), 'Manifest is not precached')
  for (const asset of precacheAssets) await verifyFile(asset)
  const workboxModules = [...worker.matchAll(/"\.\/(workbox-[^"]+)"/g)]
  for (const match of workboxModules) await verifyFile(`${match[1]}.js`)
  assert.ok(workboxModules.length > 0, 'Missing service-worker runtime')

  const appAsset = references.find((asset) => /\/assets\/index-.*\.js$/.test(asset))
  assert.ok(appAsset, 'Missing app JavaScript')
  const appBundles = precacheAssets.filter((asset) => asset.endsWith('.js'))
  const bundle = (await Promise.all(appBundles.map(async (asset) => (await verifyFile(asset)).toString()))).join('\n')
  for (const scene of ['SugarcaneScene', 'ConstructionScene', 'ShipperScene', 'NoodleScene', 'BarberScene', 'CarwashScene', 'RubberScene', 'MechanicScene', 'CoffeeScene', 'FishingScene', 'BanhmiScene', 'GasScene', 'CargoScene', 'CleaningScene', 'ElectricianScene', 'FloristScene', 'SecurityScene', 'PhotographerScene', 'CashierScene', 'HarvestScene', 'ItScene', 'AccountantScene', 'PoliceScene', 'DoctorScene', 'TeacherScene', 'TaxiScene']) {
    assert.ok(bundle.includes(scene), `${scene} missing from production bundle`)
  }
  console.log(`PASS: production HTML, manifest, icons, service worker, all scenes, and ${checked.size} local assets`)
}

module.exports = { verifyProductionAssets }
if (require.main === module) {
  verifyProductionAssets().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
