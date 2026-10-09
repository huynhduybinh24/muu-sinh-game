// Uses the existing QA browser. No raster/font library or app dependency needed.
const fs = require('node:fs/promises')
const path = require('node:path')
const { logo, icon, townBackdrop, nativeVector, colors } = require('./brand-art.cjs')
const root = path.resolve(__dirname, '..')
const res = 'android/app/src/main/res'
const jobs = []
async function write(relative, content) {
  const target = path.join(root, relative)
  await fs.mkdir(path.dirname(target), { recursive: true })
  const bytes = typeof content === 'string' ? content.replace(/[ \t]+\n/g, '\n') : content
  for (let attempt = 0; ; attempt++) {
    try { await fs.writeFile(target, bytes); break }
    catch (error) {
      // Windows resource/index scanners can briefly hold generated PNGs open.
      if (attempt >= 4 || !['EBUSY', 'EPERM', 'UNKNOWN'].includes(error.code)) throw error
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt))
    }
  }
}
async function raster(relative, source, width, height = width) {
  jobs.push({ relative, source, width, height })
}
async function main() {
  // Resolve before writing: regeneration never leaves half a set if tooling is missing.
  const { chromium } = require(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
  for (const kind of ['horizontal', 'compact', 'emblem', 'light', 'dark', 'transparent']) {
    const source = logo(kind)
    await write(`public/branding/logo-${kind}.svg`, source)
    await raster(`public/branding/logo-${kind}.png`, source, kind === 'emblem' ? 512 : kind === 'compact' ? 1080 : 1920, kind === 'emblem' ? 512 : kind === 'compact' ? 630 : 560)
  }
  await write('public/branding/town-backdrop.svg', townBackdrop())
  await write('public/branding/app-icon.svg', icon())
  await write('public/branding/adaptive-foreground.svg', icon({ foreground: true }))
  await write('public/branding/monochrome.svg', icon({ foreground: true, mono: true }))
  await write('src/brand-tokens.css', `/* Generated from src/data/brand.json by npm run branding:generate. */\n:root {\n${Object.entries(colors).map(([key, value]) => `  --brand-${key}: ${value};`).join('\n')}\n}\n`)
  await write('public/favicon.svg', icon())
  for (const size of [192, 512]) await raster(`public/pwa-icon-${size}.png`, icon(), size)
  await raster('public/pwa-maskable-512.png', icon({ maskable: true }), 512)
  await raster('public/apple-touch-icon.png', icon({ maskable: true }), 180)
  await raster('public/favicon-48.png', icon(), 48)
  for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    await raster(`${res}/mipmap-${density}/ic_launcher.png`, icon(), size)
    await raster(`${res}/mipmap-${density}/ic_launcher_round.png`, icon({ round: true }), size)
  }
  await write(`${res}/drawable-v24/ic_launcher_foreground.xml`, nativeVector())
  await write(`${res}/drawable/ic_launcher_monochrome.xml`, nativeVector({ mono: true }))
  await write(`${res}/drawable/brand_splash_icon.xml`, nativeVector({ splash: true }))
  await write(`${res}/drawable/ic_launcher_background.xml`, `<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><gradient android:angle="270" android:startColor="${colors.teal}" android:endColor="#1686AD"/></shape>\n`)
  const browser = await chromium.launch({ executablePath: process.env.PWA_QA_BROWSER, headless: true })
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 })
    for (const job of jobs) {
      await page.setViewportSize({ width: job.width, height: job.height })
      await page.setContent(`<html><body style="margin:0;background:transparent"><img style="display:block;width:100%;height:100%" src="data:image/svg+xml;base64,${Buffer.from(job.source).toString('base64')}"></body></html>`)
      await page.locator('img').evaluate((element) => element.decode())
      await write(job.relative, await page.screenshot({ omitBackground: true }))
    }
  } finally { await browser.close() }
  console.log(`Generated 6 SVG/PNG logos, web icons, town art and ${jobs.length} PNG exports; Android vectors share original geometry.`)
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
