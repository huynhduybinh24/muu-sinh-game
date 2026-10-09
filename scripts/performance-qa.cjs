// Desktop reference measurements only, not an Android performance benchmark.
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
const { completeProfile, dismissReward } = require('./profile-qa.cjs')

function observeNative(state) {
  localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 5, state }))
  const listeners = new Map(), games = []
  let sequence = 0, phaser
  window.androidBridge = {}
  window.__performanceQA = { games, back() {
    for (const entry of listeners.values()) if (entry.event === 'backButton') entry.callback({})
  } }
  window.Capacitor = {
    PluginHeaders: [{ name: 'App', methods: [{ name: 'minimizeApp', rtype: 'promise' }, { name: 'addListener', rtype: 'callback' }, { name: 'removeListener', rtype: 'callback' }] }],
    nativePromise: async () => undefined,
    nativeCallback: (_plugin, method, options, callback) => {
      if (method === 'addListener') { const id = String(sequence++); listeners.set(id, { event: options.eventName, callback }); return id }
      if (method === 'removeListener') listeners.delete(options.callbackId)
    },
  }
  Object.defineProperty(window, 'Phaser', { configurable: true, get: () => phaser, set(value) {
    phaser = value
    value.Game = new Proxy(value.Game, { construct(target, args) {
      const started = performance.now(), game = Reflect.construct(target, args)
      const record = { game: new WeakRef(game), createdAt: started, readyMs: null }
      game.events.once(value.Core.Events.READY, () => { record.readyMs = performance.now() - started })
      games.push(record); return game
    } })
  } })
}

async function measureSceneDisposal(browser, origin, state) {
  // Real engine/time, simulated Capacitor Back only. Not native device results.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  try {
    await context.addInitScript(observeNative, state)
    const page = await context.newPage(), cdp = await context.newCDPSession(page), errors = [], samples = []
    page.on('pageerror', error => errors.push(error.message))
    await cdp.send('Performance.enable')
    await page.goto(origin); await page.locator('.home-player').waitFor(); await dismissReward(page)
    const sample = async name => {
      await cdp.send('HeapProfiler.collectGarbage')
      const metrics = (await cdp.send('Performance.getMetrics')).metrics
      const engine = await page.evaluate(() => ({ connected: window.__performanceQA.games.filter(e => e.game.deref()?.canvas?.isConnected).length,
        readyMs: window.__performanceQA.games.at(-1)?.readyMs, survivingGames: window.__performanceQA.games.filter(e => e.game.deref()).length }))
      assert.equal(engine.connected, 0)
      samples.push({ name, ...engine, jsHeapBytes: metrics.find(m => m.name === 'JSHeapUsedSize').value,
        domNodes: metrics.find(m => m.name === 'Nodes').value })
    }
    await sample('before')
    for (const name of ['Phụ hồ', 'Bán nước mía', 'Shipper', 'Bán hoa', 'Lập trình viên', 'Tài xế', 'Phụ hồ']) {
      await page.getByRole('button', { name: 'SỰ NGHIỆP', exact: true }).click()
      await page.getByRole('button', { name: `Chơi ${name}`, exact: true }).click()
      await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
      await page.locator('.game-start-overlay').waitFor()
      const start = page.getByRole('button', { name: 'BẮT ĐẦU', exact: true })
      if (await start.count()) await start.click()
      await page.waitForFunction(() => window.__performanceQA.games.at(-1)?.game.deref()?.scene.getScenes(true).length > 0)
      await page.waitForTimeout(1200)
      assert.equal(await page.locator('canvas').count(), 1)
      await page.evaluate(() => window.__performanceQA.back())
      await page.locator('.native-pause[open]').waitFor()
      await page.getByRole('button', { name: 'RỜI CA', exact: true }).click()
      await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
      await page.locator('.home-player').waitFor()
      await page.waitForFunction(() => window.__performanceQA.games.every(e => !e.game.deref()?.canvas?.isConnected))
      await sample(name)
      console.log(`PASS: desktop ${name} scene boot, simulated Back and post-GC teardown`)
    }
    assert.deepEqual(errors, [])
    return { method: 'SEVEN_REAL_SCENE_BOOT_DISPOSE_CYCLES_MOCK_BACK_CDP_FORCED_GC', samples }
  } finally { await context.close() }
}

async function main() {
  const artifacts = path.resolve('node_modules/.tmp/task-22d')
  await fs.mkdir(artifacts, { recursive: true })
  const { preview } = await import('vite')
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ executablePath: process.env.PWA_QA_BROWSER, headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    const report = { measuredAt: new Date().toISOString(), browser: browser.version(), method: 'HEADLESS_DESKTOP_LOOPBACK_NO_THROTTLING_NO_FAKE_CLOCK', viewport: '390x844' }
    // Default to this exact production build, not an unrelated/stale dev server.
    await page.goto(process.env.PWA_QA_BRAND_PREVIEW_URL || `${origin}/branding-preview.html`)
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())))
    assert.ok((await page.locator('body').innerText()).includes('Mỗi Ngày Một Nghề'))
    await page.screenshot({ path: path.join(artifacts, 'branding-preview.png'), fullPage: true })
    const started = performance.now()
    await page.goto(origin)
    await page.getByLabel('Bạn tên gì?', { exact: true }).waitFor()
    report.coldWelcomeMs = performance.now() - started
    report.navigation = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0]
      return { domContentLoadedMs: n.domContentLoadedEventEnd, loadMs: n.loadEventEnd,
        paints: performance.getEntriesByType('paint').map(p => ({ name: p.name, ms: p.startTime })),
        phaserFetched: performance.getEntriesByType('resource').some(r => r.name.includes('GamePage-')) }
    })
    assert.equal(report.navigation.phaserFetched, false, 'Phaser should remain lazy on Home')
    await completeProfile(page, 'Thợ đo hiệu năng')
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    report.homePhaserFetched = await page.evaluate(() => typeof window.Phaser !== 'undefined' || performance.getEntriesByType('resource').some(r => r.name.includes('GamePage-')))
    assert.equal(report.homePhaserFetched, false)
    const sampleFrames = scrolling => page.evaluate(scrolling => new Promise(resolve => {
      const intervals = [], scroller = document.querySelector('.town-scroll')
      let last = performance.now(), frames = 0
      const frame = now => {
        intervals.push(now - last); last = now; frames++
        if (scrolling) { scroller.scrollTop = frames * 19; scroller.scrollLeft = 170 + Math.sin(frames / 15) * 160 }
        if (frames < 120) requestAnimationFrame(frame)
        else {
          intervals.shift(); intervals.sort((a, b) => a - b)
          resolve({ samples: intervals.length, medianFrameMs: intervals[Math.floor(intervals.length / 2)], p95FrameMs: intervals[Math.floor(intervals.length * .95)], maxFrameMs: intervals.at(-1) })
        }
      }
      requestAnimationFrame(frame)
    }), scrolling)
    report.homeRaf = await sampleFrames(false)
    report.homeAnimations = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)
    await page.getByRole('button', { name: 'KHÁM PHÁ THỊ TRẤN', exact: true }).click()
    await page.locator('.town-scroll').waitFor()
    report.town = await page.evaluate(() => ({ locations: document.querySelectorAll('.town-location').length,
      svgElements: document.querySelectorAll('.town-canvas svg *').length,
      bodyOverflow: document.documentElement.scrollWidth > innerWidth }))
    assert.equal(report.town.locations, 26); assert.equal(report.town.bodyOverflow, false)
    report.townRaf = await sampleFrames(true)
    report.town.scrollTop = await page.locator('.town-scroll').evaluate(e => e.scrollTop)
    assert.ok(report.town.scrollTop > 0)
    await page.screenshot({ path: path.join(artifacts, 'town-scroll-390.png') })
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')).state)
    await fs.writeFile(path.join(artifacts, 'performance.json'), JSON.stringify(report, null, 2))
    report.sceneDisposal = await measureSceneDisposal(browser, origin, state)
    assert.deepEqual(errors, [])
    await fs.writeFile(path.join(artifacts, 'performance.json'), JSON.stringify(report, null, 2))
    console.log('PASS: production branding preview, lazy Phaser, desktop cold load, Home RAF and scripted Town scrolling. Measurements:', JSON.stringify(report))
    await context.close()
  } finally { await browser.close(); await new Promise(resolve => server.httpServer.close(resolve)) }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
