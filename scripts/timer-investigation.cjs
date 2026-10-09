// Observation-only, actual browser/Phaser time. No score, delta, scene or clock mutation.
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const { chromium } = require(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
const { completeProfile } = require('./profile-qa.cjs')
function observe() {
  window.__timerQA = { samples: [], events: [] }
  let phaser
  Object.defineProperty(window, 'Phaser', { configurable: true, get: () => phaser, set(value) {
    phaser = value
    value.Game = new Proxy(value.Game, { construct(target, args) {
      const scene = args[0].scene[0], complete = scene.onComplete
      const record = { createdAt: performance.now(), firstAt: null, zeroAt: null, callbackAt: null,
        smoothMs: 0, rawMs: 0, frames: 0, unfocused: 0, hidden: 0, maxRaw: 0 }
      window.__timerQA.record = record
      scene.onComplete = function(result) { record.callbackAt = performance.now(); return complete.call(this, result) }
      const game = Reflect.construct(target, args)
      for (const event of ['blur', 'focus', 'hidden', 'visible', 'pause', 'resume']) {
        game.events.on(event, () => window.__timerQA.events.push({ event, at: performance.now() }))
      }
      game.events.on('step', (_time, delta) => {
        const remaining = scene.remainingGameMs ?? scene.remainingMs
        if (remaining === undefined || scene.hasFinished && record.zeroAt !== null) return
        record.firstAt ??= performance.now()
        record.smoothMs += delta; record.rawMs += game.loop.rawDelta; record.frames++
        record.unfocused += !game.loop.inFocus ? 1 : 0
        record.hidden += document.hidden ? 1 : 0
        record.maxRaw = Math.max(record.maxRaw, game.loop.rawDelta)
        if (remaining <= 0) record.zeroAt ??= performance.now()
        if (record.frames % 120 === 0) window.__timerQA.samples.push({ at: performance.now(), remaining,
          raw: game.loop.rawDelta, smooth: delta, focused: game.loop.inFocus, hidden: document.hidden })
      })
      return game
    } })
  } })
}
async function main() {
  const { preview } = await import('vite')
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ executablePath: process.env.PWA_QA_BROWSER, headless: true })
  const report = { method: 'REAL_TIME_SEQUENTIAL_DESKTOP_OBSERVATION', browser: browser.version(), cases: [] }
  try {
    for (const [job, name, mode] of [['construction', 'Phụ hồ', 'foreground'], ['taxi', 'Tài xế', 'foreground'], ['construction', 'Phụ hồ', 'background']]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
      try {
        await context.addInitScript(observe)
        const page = await context.newPage(); await page.goto(origin); await page.bringToFront()
        await completeProfile(page, 'Thợ đo thời gian')
        await page.getByRole('button', { name: 'SỰ NGHIỆP', exact: true }).click()
        await page.getByRole('button', { name: `Chơi ${name}`, exact: true }).click()
        await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
        await page.getByRole('button', { name: 'BẮT ĐẦU', exact: true }).click()
        await page.locator('canvas').waitFor(); await page.bringToFront()
        if (mode === 'background') {
          const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront()
          await page.waitForTimeout(5000); await page.bringToFront(); await other.close()
        }
        await page.locator('.share-card-preview').waitFor({ timeout: 120000 })
        const measured = await page.evaluate(() => window.__timerQA)
        assert.ok(measured.record.callbackAt !== null)
        report.cases.push({ job, mode, ...measured })
        const r = measured.record
        console.log(JSON.stringify({ job, mode, gameplayWallMs: r.zeroAt - r.firstAt, bootMs: r.firstAt - r.createdAt,
          overlayMs: r.callbackAt - r.zeroAt, rawMs: r.rawMs, smoothMs: r.smoothMs, frames: r.frames, unfocused: r.unfocused, events: measured.events }))
      } finally { await context.close() }
    }
  } finally {
    const output = path.resolve('node_modules/.tmp/task-23'); await fs.mkdir(output, { recursive: true })
    await fs.writeFile(path.join(output, 'timers.json'), JSON.stringify(report, null, 2))
    await browser.close(); await new Promise(resolve => server.httpServer.close(resolve))
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
