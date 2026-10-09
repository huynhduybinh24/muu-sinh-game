const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
const { completeProfile, dismissReward } = require('./profile-qa.cjs')
const { verifyProductionAssets } = require('./static-qa.cjs')

async function main() {
  await verifyProductionAssets()
  const artifacts = path.resolve('node_modules/.tmp/branding-qa')
  await fs.mkdir(artifacts, { recursive: true })
  const { preview } = await import('vite')
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const browser = await chromium.launch({ executablePath: process.env.PWA_QA_BROWSER, headless: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  try {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${origin}/branding-preview.html`)
    await page.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
    await page.screenshot({ path: path.join(artifacts, 'preview-mobile.png'), fullPage: true })
    await page.setViewportSize({ width: 1100, height: 850 })
    await page.screenshot({ path: path.join(artifacts, 'preview-desktop.png'), fullPage: true })
    // Pixel-level safe-circle checks on the generated adaptive foreground.
    const safe = await page.evaluate(async () => {
      const image = new Image(); image.src = '/branding/adaptive-foreground.svg'; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 108
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
      const bytes = ctx.getImageData(0, 0, 108, 108).data
      let farthest = 0, pixels = 0
      for (let y = 0; y < 108; y++) for (let x = 0; x < 108; x++) {
        if (bytes[(y * 108 + x) * 4 + 3] > 20) {
          pixels++; farthest = Math.max(farthest, Math.hypot(x + .5 - 54, y + .5 - 54))
        }
      }
      return { farthest, pixels }
    })
    assert.ok(safe.pixels > 650)
    assert.ok(safe.farthest <= 33, `Adaptive foreground exceeds safe circle: ${safe.farthest}`)
    await page.goto(origin)
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    await completeProfile(page, 'Thợ phố nhỏ')
    const original = await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress'))
    for (const [width, height] of [[360, 800], [390, 844], [412, 915], [1024, 844]]) {
      await page.setViewportSize({ width, height })
      await page.locator('.home-content').evaluate((element) => { element.scrollTop = 0 })
      const geometry = await page.evaluate(() => {
        const footer = document.querySelector('.screen-footer').getBoundingClientRect()
        const play = document.querySelector('.home-job-actions .primary-button').getBoundingClientRect()
        return { overflow: document.documentElement.scrollWidth > innerWidth, footer: footer.bottom, play: play.bottom, viewport: innerHeight }
      })
      assert.equal(geometry.overflow, false)
      assert.ok(geometry.footer <= height + 1, `Home footer outside ${width}px viewport`)
      assert.ok(geometry.play < geometry.footer, `Primary play CTA hidden at ${width}px`)
      await page.screenshot({ path: path.join(artifacts, `home-${width}.png`) })
    }
    await page.setViewportSize({ width: 390, height: 844 })
    for (const name of ['Gara', 'Nhà của tôi', 'Mua sắm', 'Nghề & thành tựu']) {
      await page.getByRole('button', { name, exact: true }).click()
      await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
      await dismissReward(page)
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress')), original, 'Navigation changed save')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.locator('.home-brand img').evaluate((element) => getComputedStyle(element).animationName), 'none')
    await context.setOffline(true)
    await page.reload(); await page.locator('.home-player').waitFor(); await dismissReward(page)
    await page.locator('.brand-logo').evaluate((element) => element.decode())
    assert.equal(await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress')), original)
    await page.getByRole('button', { name: 'SỰ NGHIỆP', exact: true }).click()
    assert.equal(await page.locator('.career-job-card').count(), 26)
    assert.equal(await page.locator('.achievement-card').count(), 46)
    await page.getByRole('button', { name: 'Chơi Phụ hồ', exact: true }).click()
    await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
    await page.getByRole('button', { name: 'BẮT ĐẦU', exact: true }).click()
    // Real elapsed gameplay; no timer/scoring source mutation or fake-device claim.
    await page.locator('canvas').waitFor()
    await page.locator('.share-card-preview').waitFor({ timeout: 65000 })
    assert.equal(await page.locator('canvas').count(), 0)
    await page.screenshot({ path: path.join(artifacts, 'result-offline.png'), fullPage: true })
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'LƯU ẢNH', exact: true }).click()
    await (await download).saveAs(path.join(artifacts, 'result-card.png'))
    const png = await fs.readFile(path.join(artifacts, 'result-card.png'))
    assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1350)
    assert.deepEqual(errors, [])
    console.log(`PASS: branding preview, adaptive safe circle (${safe.farthest.toFixed(2)}dp), Home at four sizes, navigation, 26 jobs/46 achievements, reduced motion, offline branding/storage/game/result/PNG. Screenshots: ${artifacts}`)
  } finally {
    await context.close(); await browser.close()
    await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
