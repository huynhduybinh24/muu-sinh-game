// Uses an existing Playwright installation; no app/test dependency is added.
// PWA_QA_PLAYWRIGHT may point to a bundled Playwright package directory.
const { chromium } = require(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const { completeProfile, verifyProfileFlows } = require('./profile-qa.cjs')

const origin = process.env.PWA_QA_URL || 'http://127.0.0.1:4173'
const sizes = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
]

async function assertLayout(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  assert.ok(dimensions.scrollWidth <= dimensions.viewport, `${label}: horizontal overflow`)
}

async function readProgress(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')).state)
}

async function verifyUpdate(browser, artifacts) {
  // Proxy the production preview; vary only worker bytes to mimic a new deploy.
  // No source, build files, or user's browser storage are changed.
  let version = 1
  const server = http.createServer(async (request, response) => {
    try {
      const upstream = await fetch(`${origin}${request.url}`)
      const body = await upstream.arrayBuffer()
      response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream')
      response.setHeader('Cache-Control', 'no-store')
      response.statusCode = upstream.status
      response.end(request.url.split('?')[0] === '/sw.js'
        ? `${Buffer.from(body).toString()}\n/* QA release ${version} */`
        : Buffer.from(body))
    } catch {
      response.statusCode = 502
      response.end()
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const updateOrigin = `http://127.0.0.1:${server.address().port}`
  const context = await browser.newContext({ viewport: sizes[0] })
  try {
    const page = await context.newPage()
    await page.goto(updateOrigin)
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    await completeProfile(page, 'Thợ cập nhật')
    await page.getByRole('button', { name: 'Tắt âm thanh' }).click()
    const progress = await readProgress(page)
    version = 2
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration.update()
    })
    await page.getByText('CÓ PHIÊN BẢN MỚI').waitFor()
    await assertLayout(page, 'Update banner')
    await page.screenshot({ path: path.join(artifacts, 'update-banner-360.png') })
    const reload = page.waitForEvent('load')
    await page.getByRole('button', { name: 'CẬP NHẬT', exact: true }).click()
    await reload
    await page.getByRole('heading', { name: 'MƯU SINH' }).waitFor()
    assert.deepEqual(await readProgress(page), progress)
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update())
    assert.equal(await page.getByText('CÓ PHIÊN BẢN MỚI').count(), 0)
    console.log('PASS: waiting update, user-requested reload, persisted storage, and no update loop')
    const installedPage = await context.newPage()
    await installedPage.addInitScript(() => {
      Object.defineProperty(navigator, 'standalone', { value: true })
    })
    await installedPage.goto(updateOrigin)
    await installedPage.locator('.home-player').waitFor()
    await assertLayout(installedPage, 'Standalone Home')
    await installedPage.screenshot({ path: path.join(artifacts, 'standalone-home.png') })
    await installedPage.evaluate(() => {
      const prompt = new Event('beforeinstallprompt', { cancelable: true })
      Object.assign(prompt, {
        prompt: async () => undefined,
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      })
      window.dispatchEvent(prompt)
    })
    assert.equal(await installedPage.getByRole('button', { name: /CÀI GAME/ }).count(), 0)
    console.log('PASS: standalone mode suppresses install CTA even when an install event arrives')
  } finally {
    await context.close()
    await new Promise((resolve) => server.close(resolve))
  }
}

async function main() {
  const artifacts = await fs.mkdtemp(path.join(os.tmpdir(), 'muu-sinh-pwa-qa-'))
  console.log(`QA artifacts: ${artifacts}`)
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PWA_QA_BROWSER ? { executablePath: process.env.PWA_QA_BROWSER } : {}),
  })
  try {
    if (process.argv.includes('--updates-only')) {
      await verifyUpdate(browser, artifacts)
      return
    }
    const context = await browser.newContext({
      viewport: sizes[1],
      hasTouch: true,
      isMobile: true,
      acceptDownloads: true,
      timezoneId: 'Asia/Ho_Chi_Minh',
    })
    const page = await context.newPage()
    const diagnostics = await context.newCDPSession(page)
    await diagnostics.send('ServiceWorker.enable')
    diagnostics.on('ServiceWorker.workerErrorReported', ({ errorMessage }) => {
      console.error('Service-worker error:', errorMessage)
    })
    const errors = []
    context.on('serviceworker', (worker) => console.log('Service worker:', worker.url()))
    page.on('response', (response) => {
      if (response.status() >= 400) console.error('HTTP error:', response.status(), response.url())
    })
    page.on('requestfailed', (request) => console.error('Request failed:', request.url(), request.failure()))
    page.on('pageerror', (error) => {
      errors.push(error.message)
      console.error('Browser error:', error.message)
    })
    page.on('console', (message) => {
      if (message.type() === 'error') console.error('Browser console:', message.text())
    })
    await page.goto(origin)
    console.log('Loaded production app')
    await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.active))
      .catch(async (error) => {
        console.error(await page.evaluate(async () => ({
          registrations: (await navigator.serviceWorker.getRegistrations()).map((registration) => ({
            scope: registration.scope,
            active: registration.active?.state,
            installing: registration.installing?.state,
            waiting: registration.waiting?.state,
          })),
          caches: await caches.keys(),
        })))
        throw error
      })
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

    const manifest = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="manifest"]')
      return (await fetch(link.href)).json()
    })
    assert.equal(manifest.name, 'MƯU SINH – Mỗi Ngày Một Nghề')
    assert.equal(manifest.short_name, 'MƯU SINH')
    assert.equal(manifest.display, 'standalone')
    assert.equal(manifest.lang, 'vi')
    assert.equal(manifest.start_url, '/')
    assert.equal(manifest.scope, '/')
    for (const size of [192, 512]) {
      const response = await context.request.get(`${origin}/pwa-icon-${size}.png`)
      assert.equal(response.status(), 200)
      const bytes = await response.body()
      assert.equal(bytes.readUInt32BE(16), size)
      assert.equal(bytes.readUInt32BE(20), size)
    }
    console.log('PASS: production manifest, icon dimensions, and service-worker control')
    await verifyProfileFlows(browser, page, origin, artifacts, assertLayout)

    if (await page.getByRole('button', { name: 'Tắt âm thanh' }).count()) {
      await page.getByRole('button', { name: 'Tắt âm thanh' }).click()
    }
    const saved = await readProgress(page)
    await context.setOffline(true)
    // New Playwright network routing does not always change navigator.onLine.
    await diagnostics.send('Network.emulateNetworkConditions', {
      offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
    })
    await page.reload()
    await page.getByRole('heading', { name: 'MƯU SINH' }).waitFor()
    assert.deepEqual(await readProgress(page), saved)
    console.log('Offline state:', await page.evaluate(() => ({
      online: navigator.onLine,
      notices: [...document.querySelectorAll('.connection-notice, .offline-ready')].map((notice) => notice.textContent),
    })))
    await page.screenshot({ path: path.join(artifacts, 'offline-home.png') })
    await page.getByText('📴 ĐANG CHƠI OFFLINE').waitFor()
    console.log('PASS: offline reload preserves progress and preferences')

    await page.clock.install({ time: new Date('2026-10-06T05:00:00Z') })
    const jobsSeen = new Set()
    for (let index = 0; index < sizes.length; index++) {
      await page.setViewportSize(sizes[index])
      await page.clock.setFixedTime(new Date(`2026-10-0${6 + index}T05:00:00Z`))
      // Re-enter Home so the daily date is read again without touching app storage.
      await page.getByRole('button', { name: 'SỰ NGHIỆP', exact: true }).click()
      await page.getByRole('heading', { name: 'SỰ NGHIỆP', exact: true }).waitFor()
      await assertLayout(page, 'Career')
      await page.screenshot({ path: path.join(artifacts, `career-${sizes[index].width}.png`) })
      await page.getByRole('button', { name: '← VỀ TRANG CHỦ' }).click()
      await assertLayout(page, 'Home')
      await page.screenshot({ path: path.join(artifacts, `home-${sizes[index].width}.png`) })
      await page.getByRole('button', { name: /^(ĐI LÀM|CHƠI LẠI) →$/ }).click()
      await assertLayout(page, 'Reveal')
      const job = await page.locator('.job-name').innerText()
      jobsSeen.add(job)
      await page.screenshot({ path: path.join(artifacts, `reveal-${sizes[index].width}.png`) })
      await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
      await page.getByRole('dialog').waitFor()
      for (const size of sizes) {
        await page.setViewportSize(size)
        await assertLayout(page, 'Tutorial')
        await page.screenshot({ path: path.join(artifacts, `tutorial-${job}-${size.width}.png`) })
      }
      await page.setViewportSize(sizes[index])
      await page.getByRole('button', { name: 'BẮT ĐẦU', exact: true }).click()
      await page.clock.runFor(4_000)
      await page.locator('canvas').waitFor()
      assert.equal(await page.locator('canvas').count(), 1)
      for (const size of sizes) {
        await page.setViewportSize(size)
        await assertLayout(page, 'Game')
        const bounds = await page.locator('canvas').boundingBox()
        assert.ok(bounds.y + bounds.height <= size.height, 'Game controls below viewport')
        assert.equal(await page.locator('canvas').count(), 1)
        await page.screenshot({ path: path.join(artifacts, `game-${job}-${size.width}.png`) })
      }
      await page.setViewportSize(sizes[index])
      await page.clock.runFor(47_000)
      await page.locator('.share-card-preview').waitFor()
      assert.equal(
        (await page.locator('.share-card-preview h1').innerText()).toLocaleUpperCase('vi-VN'),
        job.toLocaleUpperCase('vi-VN'),
      )
      assert.equal(await page.locator('canvas').count(), 0)
      await assertLayout(page, 'Result')
      await page.screenshot({ path: path.join(artifacts, `result-${sizes[index].width}.png`) })
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'LƯU ẢNH', exact: true }).click()
      const download = await downloadPromise
      assert.match(download.suggestedFilename(), /^muu-sinh-(sugarcane|construction|shipper)-\d{4}-\d{2}-\d{2}\.png$/)
      const downloadPath = path.join(artifacts, download.suggestedFilename())
      await download.saveAs(downloadPath)
      const png = await fs.readFile(downloadPath)
      assert.equal(png.readUInt32BE(16), 1080)
      assert.equal(png.readUInt32BE(20), 1350)
      const completed = await readProgress(page)
      assert.equal(completed.totalGamesPlayed, saved.totalGamesPlayed + index + 1)
      const expectedJobId = ['shipper', 'sugarcane', 'construction'][index]
      assert.equal(completed.currentJobId, expectedJobId, 'Incorrect daily scene/result routing')
      assert.equal(completed.jobStats[expectedJobId].timesPlayed, saved.jobStats[expectedJobId].timesPlayed + 1)
      console.log(`PASS: ${job} offline at ${sizes[index].width}×${sizes[index].height}; result and PNG export`)
      await page.getByRole('button', { name: 'VỀ TRANG CHỦ →' }).click()
    }
    assert.equal(jobsSeen.size, 3, 'All jobs must be checked')
    const persisted = await readProgress(page)
    await page.reload()
    assert.deepEqual(await readProgress(page), persisted)
    assert.equal(await page.getByRole('button', { name: /CÀI GAME/ }).count(), 0)
    // Simulate browser install events; never install onto the user's device.
    await page.evaluate(() => {
      const prompt = new Event('beforeinstallprompt', { cancelable: true })
      Object.assign(prompt, {
        prompt: async () => undefined,
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      })
      window.dispatchEvent(prompt)
    })
    await page.getByRole('button', { name: /CÀI GAME/ }).click()
    assert.equal(await page.getByRole('button', { name: /CÀI GAME/ }).count(), 0)
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
    assert.equal(await page.getByRole('button', { name: /CÀI GAME/ }).count(), 0)
    console.log('PASS: install CTA is conditional and hides after acceptance/installation')
    await page.getByRole('button', { name: /CHƠI LẠI →/ }).click()
    await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
    assert.equal(await page.getByRole('dialog').count(), 0, 'Tutorial repeated after completion')
    await page.clock.runFor(4_000)
    await page.locator('canvas').waitFor()
    assert.equal(await page.locator('canvas').count(), 1)
    console.log('PASS: replay opens exactly one Phaser canvas without duplicating the tutorial')
    await context.setOffline(false)
    await diagnostics.send('Network.emulateNetworkConditions', {
      offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
    })
    await page.getByText('✓ ĐÃ KẾT NỐI LẠI').waitFor()
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      await registration.update()
    })
    assert.equal(await page.getByText('CÓ PHIÊN BẢN MỚI').count(), 0, 'Update prompt loops without a new build')
    assert.deepEqual(errors, [], `Browser errors: ${errors.join('; ')}`)
    console.log('PASS: career, tutorials, all jobs, sharing, storage, and reconnection')
    await context.close()
    await verifyUpdate(browser, artifacts)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
