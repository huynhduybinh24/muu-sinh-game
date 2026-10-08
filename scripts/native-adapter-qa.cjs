// Production browser integration with a mocked bridge. NOT an Android/WebView/device test.
const assert = require('node:assert/strict')
const { dismissReward } = require('./profile-qa.cjs')

async function verifyNativeAdapter(browser, origin, baseState) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  try {
    await context.addInitScript((state) => {
      localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 5, state }))
      const listeners = new Map()
      let sequence = 0
      window.androidBridge = {} // Capacitor's platform detector; test injection only.
      window.__nativeQA = { listeners, minimized: 0, emit(event, data = {}) {
        for (const entry of listeners.values()) if (entry.event === event) entry.callback(data)
      } }
      window.Capacitor = {
        PluginHeaders: [{ name: 'App', methods: [{ name: 'minimizeApp', rtype: 'promise' },
          { name: 'addListener', rtype: 'callback' }, { name: 'removeListener', rtype: 'callback' }] }],
        nativePromise: async (plugin, method) => { if (plugin === 'App' && method === 'minimizeApp') window.__nativeQA.minimized++ },
        nativeCallback: (plugin, method, options, callback) => {
          if (method === 'addListener') { const id = String(sequence++); listeners.set(id, { event: options.eventName, callback }); return id }
          if (method === 'removeListener') listeners.delete(options.callbackId)
        },
      }
    }, baseState)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.clock.install({ time: new Date('2026-10-08T05:00:00Z') })
    await page.goto(origin); await page.locator('.home-player').waitFor(); await dismissReward(page)
    await page.waitForFunction(() => window.__nativeQA.listeners.size === 3)
    assert.equal(await page.locator('html.native-android').count(), 1)
    assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), 0)
    await page.evaluate(() => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'accepted' }) })))
    assert.equal(await page.getByRole('button', { name: /CÀI GAME/ }).count(), 0)
    const back = () => page.evaluate(() => window.__nativeQA.emit('backButton'))
    await page.getByRole('button', { name: 'KHÁM PHÁ THỊ TRẤN', exact: true }).click()
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await back(); await page.locator('.town-content').waitFor()
    await back(); await page.locator('.home-player').waitFor()
    await back(); assert.equal(await page.evaluate(() => window.__nativeQA.minimized), 1)
    // Back cancels destructive dialogs; it must not reset data or leave the screen.
    const untouched = await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress'))
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await page.locator('.save-data-panel summary').click()
    await page.getByRole('button', { name: 'XÓA TOÀN BỘ DỮ LIỆU', exact: true }).click()
    const confirmation = page.locator('.reset-confirm-label input')
    await confirmation.focus()
    await back()
    assert.equal(await confirmation.evaluate((element) => document.activeElement === element), false)
    assert.equal(await page.locator('dialog[open]').count(), 1, 'First Back dismisses editing focus, not dialog')
    await back()
    assert.equal(await page.locator('dialog[open]').count(), 0)
    assert.equal(await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress')), untouched)
    await back(); await page.locator('.home-player').waitFor()
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')).state.totalGamesPlayed)
    for (const name of ['Bán nước mía', 'Phụ hồ', 'Shipper', 'Bán hủ tiếu', 'Cắt tóc', 'Rửa xe', 'Cạo cao su', 'Sửa xe', 'Pha cà phê', 'Đánh cá']) {
      await page.getByRole('button', { name: 'KHÁM PHÁ THỊ TRẤN', exact: true }).click()
      await page.locator('.town-directory summary').click()
      await page.getByRole('button', { name: `Chọn ${name}`, exact: true }).click(); await page.clock.runFor(650)
      await page.getByRole('dialog').getByRole('button', { name: 'ĐI LÀM', exact: true }).click()
      await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
      await page.getByRole('button', { name: 'BẮT ĐẦU', exact: true }).click()
      await page.clock.runFor(4000); await page.locator('canvas').waitFor()
      await back(); await page.locator('.native-pause[open]').waitFor()
      await page.clock.runFor(100)
      const frozen = await page.locator('canvas').screenshot({ animations: 'disabled' })
      await page.clock.runFor(2000)
      assert.deepEqual(await page.locator('canvas').screenshot({ animations: 'disabled' }), frozen, `${name}: engine must not render during native pause`)
      await page.getByRole('button', { name: 'TIẾP TỤC', exact: true }).click()
      await page.clock.runFor(1000)
      assert.equal(await page.locator('canvas').count(), 1)
      await page.evaluate(() => window.__nativeQA.emit('pause'))
      await page.locator('.native-pause[open]').waitFor()
      await page.getByRole('button', { name: 'RỜI CA', exact: true }).click()
      await page.locator('.town-content').waitFor(); await page.clock.runFor(32)
      assert.equal(await page.locator('canvas').count(), 0)
      await back(); await page.locator('.home-player').waitFor()
    }
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')).state.totalGamesPlayed), before)
    assert.deepEqual(errors, [])
    console.log('PASS: MOCK-BRIDGE browser integration (not device): no native SW/install CTA, Back editing/dialog/history/minimize, ten games freeze/resume, clean paused teardown and no false results')
  } finally { await context.close() }
}
module.exports = { verifyNativeAdapter }
