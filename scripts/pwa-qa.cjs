// Uses an existing Playwright installation; no app/test dependency is added.
// PWA_QA_PLAYWRIGHT may point to a bundled Playwright package directory.
const { chromium } = require(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const { completeProfile, verifyProfileFlows, dismissReward } = require('./profile-qa.cjs')
const { verifyShopFlows } = require('./shop-qa.cjs')
const { verifyDailyFlows } = require('./daily-qa.cjs')
const { verifySaveFlows } = require('./save-qa.cjs')
const { verifyTownFlows } = require('./town-qa.cjs')
const { verifyNativeAdapter } = require('./native-adapter-qa.cjs')

const origin = process.env.PWA_QA_URL || 'http://127.0.0.1:4173'
const sizes = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
]
const dailyCases = [
  { date: '2026-10-07', id: 'sugarcane' }, { date: '2026-10-08', id: 'construction' },
  { date: '2026-10-09', id: 'shipper' }, { date: '2026-10-13', id: 'noodle' },
  { date: '2026-10-14', id: 'barber' }, { date: '2026-10-15', id: 'carwash' },
  { date: '2026-11-06', id: 'rubber' }, { date: '2026-11-07', id: 'mechanic' },
  { date: '2026-11-08', id: 'coffee' }, { date: '2026-11-09', id: 'fishing' },
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
    await dismissReward(installedPage)
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
    await context.setOffline(true)
    await installedPage.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await installedPage.locator('.save-data-panel summary').click()
    const backupDownload = installedPage.waitForEvent('download')
    await installedPage.getByRole('button', { name: 'TẢI FILE SAO LƯU', exact: true }).click()
    const backupFile = await backupDownload
    const backupPath = path.join(artifacts, 'standalone-backup.json')
    await backupFile.saveAs(backupPath)
    const portable = JSON.parse(await fs.readFile(backupPath, 'utf8'))
    assert.deepEqual(portable.data, progress)
    await installedPage.getByLabel('Chọn file sao lưu JSON').setInputFiles(backupPath)
    await installedPage.getByRole('dialog').getByRole('button', { name: 'KHÔI PHỤC', exact: true }).click()
    await installedPage.locator('.home-player').waitFor()
    await dismissReward(installedPage)
    assert.deepEqual(await readProgress(installedPage), progress)
    console.log('PASS: standalone-mode PWA exports and restores backup offline')
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
    await page.getByRole('button', { name: 'CỬA HÀNG', exact: true }).click()
    await page.getByRole('tab', { name: 'ÁO', exact: true }).click()
    assert.equal(await page.locator('[data-item-id="shirt-blue"]').getByRole('button', { name: 'KHÔNG ĐỦ TIỀN', exact: true }).isDisabled(), true)
    assert.equal(await page.locator('[data-item-id="shirt-rose"]').getByRole('button', { name: 'MỞ Ở LEVEL 5', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    await verifyShopFlows(browser, origin, artifacts, assertLayout, await readProgress(page))
    await verifyDailyFlows(browser, origin, artifacts, assertLayout, await readProgress(page))
    await verifySaveFlows(browser, origin, artifacts, assertLayout, await readProgress(page))
    await verifyTownFlows(browser, origin, artifacts, assertLayout, await readProgress(page))
    await verifyNativeAdapter(browser, origin, await readProgress(page))
    if (process.argv.includes('--town-only')) return
    if (process.argv.includes('--daily-only')) {
      await context.close()
      return
    }

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
    await dismissReward(page)
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
    for (let index = 0; index < dailyCases.length; index++) {
      const size = sizes[index % sizes.length]
      const daily = dailyCases[index]
      await page.setViewportSize(size)
      await page.clock.setFixedTime(new Date(`${daily.date}T05:00:00Z`))
      // Re-enter Home so the daily date is read again without touching app storage.
      await page.getByRole('button', { name: 'SỰ NGHIỆP', exact: true }).click()
      await page.getByRole('heading', { name: 'SỰ NGHIỆP', exact: true }).waitFor()
      assert.equal(await page.locator('.career-job-card').count(), 10)
      await assertLayout(page, 'Career')
      await page.screenshot({ path: path.join(artifacts, `career-${daily.id}-${size.width}.png`) })
      await page.getByRole('button', { name: '← VỀ TRANG CHỦ' }).click()
      await dismissReward(page)
      await assertLayout(page, 'Home')
      await page.screenshot({ path: path.join(artifacts, `home-${daily.id}-${size.width}.png`) })
      await page.getByRole('button', { name: /^(ĐI LÀM|CHƠI LẠI) →$/ }).click()
      await assertLayout(page, 'Reveal')
      const job = await page.locator('.job-name').innerText()
      jobsSeen.add(job)
      await page.screenshot({ path: path.join(artifacts, `reveal-${daily.id}-${size.width}.png`) })
      await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
      await page.getByRole('dialog').waitFor()
      for (const size of sizes) {
        await page.setViewportSize(size)
        await assertLayout(page, 'Tutorial')
        await page.screenshot({ path: path.join(artifacts, `tutorial-${job}-${size.width}.png`) })
      }
      await page.setViewportSize(size)
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
      await page.setViewportSize(size)
      // Countdown already advanced 4s above; advance one full 45s game, preserving toast time.
      await page.clock.runFor(45_000)
      await page.locator('.share-card-preview').waitFor()
      if (index === 2) {
        // Inspect transient feedback immediately, before screenshots/PNG export can consume its lifetime.
        await page.getByText('LÊN CẤP! LEVEL 2', { exact: true }).waitFor()
        await page.getByRole('button', { name: 'Đóng thông báo lên cấp', exact: true }).click()
        assert.equal(await page.locator('.level-up-toast').count(), 0)
      }
      assert.equal(
        (await page.locator('.share-card-preview h1').innerText()).toLocaleUpperCase('vi-VN'),
        job.toLocaleUpperCase('vi-VN'),
      )
      assert.equal(await page.locator('canvas').count(), 0)
      await assertLayout(page, 'Result')
      await page.screenshot({ path: path.join(artifacts, `result-${daily.id}-${size.width}.png`) })
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'LƯU ẢNH', exact: true }).click()
      const download = await downloadPromise
      assert.equal(download.suggestedFilename(), `muu-sinh-${daily.id}-${daily.date}.png`)
      const downloadPath = path.join(artifacts, download.suggestedFilename())
      await download.saveAs(downloadPath)
      const png = await fs.readFile(downloadPath)
      assert.equal(png.readUInt32BE(16), 1080)
      assert.equal(png.readUInt32BE(20), 1350)
      const completed = await readProgress(page)
      assert.equal(completed.dailyMissions.dateKey, daily.date)
      assert.equal(completed.dailyMissions.missions.length, 3)
      for (const mission of completed.dailyMissions.missions) {
        if (['play-3', 'play-8', 'daily-shifts'].includes(mission.id)) assert.equal(mission.progress, 1, 'Game commit must update mission progress centrally')
      }
      assert.equal(completed.xp, saved.xp + 30 * (index * 2 + 1), 'Zero-score game XP must be awarded once')
      assert.equal(completed.totalGamesPlayed, saved.totalGamesPlayed + index * 2 + 1)
      const expectedJobId = daily.id
      assert.equal(completed.currentJobId, expectedJobId, 'Incorrect daily scene/result routing')
      assert.equal(completed.jobStats[expectedJobId].timesPlayed, saved.jobStats[expectedJobId].timesPlayed + 1)
      await page.getByRole('button', { name: 'CHƠI LẠI', exact: true }).click()
      assert.equal(await page.getByRole('dialog').count(), 0)
      await page.clock.runFor(4_000)
      await page.locator('canvas').waitFor()
      assert.equal(await page.locator('canvas').count(), 1)
      await page.clock.runFor(47_000)
      await page.locator('.share-card-preview').waitFor()
      assert.equal(await page.locator('canvas').count(), 0)
      const replayed = await readProgress(page)
      for (const mission of replayed.dailyMissions.missions) {
        if (['play-3', 'play-8', 'daily-shifts'].includes(mission.id)) assert.equal(mission.progress, 2, 'Replay must count toward daily missions')
      }
      assert.equal(replayed.jobStats[expectedJobId].timesPlayed, saved.jobStats[expectedJobId].timesPlayed + 2)
      assert.equal(replayed.totalDaysWorked, completed.totalDaysWorked, 'Replay must not add another daily completion')
      console.log(`PASS: ${job} offline at ${size.width}×${size.height}; timer, result, career, PNG export and replay`)
      await page.getByRole('button', { name: 'VỀ TRANG CHỦ →' }).click()
    }
    assert.equal(jobsSeen.size, 10, 'All ten jobs must be checked')
    const persisted = await readProgress(page)
    await page.reload()
    await page.locator('.home-player').waitFor()
    await dismissReward(page)
    assert.deepEqual(await readProgress(page), persisted)
    assert.equal(await page.locator('.level-up-toast').count(), 0, 'Level-up toast replayed after refresh')
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
