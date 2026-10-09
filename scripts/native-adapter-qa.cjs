// Production browser integration with a mocked bridge. NOT an Android/WebView/device test.
const assert = require('node:assert/strict')
const { dismissReward } = require('./profile-qa.cjs')

async function verifyNativeAdapter(browser, origin, baseState, { policyOnly = false } = {}) {
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
      // Observe the actual production engine so boot/React effects are settled
      // before testing a paused canvas. A DOM canvas can precede Phaser READY.
      let phaser
      Object.defineProperty(window, 'Phaser', { configurable: true, get: () => phaser, set(value) {
        phaser = value
        value.Game = new Proxy(value.Game, { construct(target, args) {
          const game = Reflect.construct(target, args)
          window.__nativeQA.game = new WeakRef(game)
          return game
        } })
      } })
    }, { ...baseState, money: 2_000_000, xp: 900 })
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
    if (policyOnly) await context.setOffline(true)
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    const beforePolicy = await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress'))
    await page.locator('.privacy-policy summary').click()
    await page.getByRole('link', { name: 'XEM BẢN NHÁP HTML — CHỜ DUYỆT', exact: true }).click()
    await page.locator('.privacy-dialog[open]').waitFor()
    assert.equal(await page.locator('.privacy-dialog section').count(), 6)
    await back(); assert.equal(await page.locator('.privacy-dialog').count(), 0)
    assert.equal(await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress')), beforePolicy)
    await back(); await page.locator('.home-player').waitFor()
    assert.equal(await page.evaluate(() => window.__nativeQA.listeners.size), 3)
    console.log('PASS: MOCK-BRIDGE offline policy dialog closes on Back without navigation/save/listener changes')
    if (policyOnly) {
      await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
      await page.locator('.save-data-panel summary').click()
      await page.getByRole('button', { name: 'ĐẶT LẠI TIẾN TRÌNH', exact: true }).click()
      await page.getByRole('dialog', { name: 'ĐẶT LẠI TIẾN TRÌNH?' }).waitFor()
      await page.locator('.reset-confirm-label input').focus()
      await back()
      assert.equal(await page.locator('dialog[open]').count(), 1, 'First Back dismisses editing focus')
      await back(); assert.equal(await page.locator('dialog[open]').count(), 0)
      assert.equal(await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress')), beforePolicy)
      console.log('PASS: MOCK-BRIDGE recovery-aware reset dialog cancels on Back without deleting save')
      return
    }
    await page.getByRole('button', { name: 'KHÁM PHÁ THỊ TRẤN', exact: true }).click()
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await back(); await page.locator('.town-content').waitFor()
    await back(); await page.locator('.home-player').waitFor()
    await back(); assert.equal(await page.evaluate(() => window.__nativeQA.minimized), 1)
    for (const [button,heading] of [['THIẾT BỊ','THIẾT BỊ CỦA TÔI'],['GARA','GARA CỦA TÔI'],['PHÒNG CỦA TÔI','PHÒNG CỦA TÔI']]) {
      await page.getByRole('button',{name:'HỒ SƠ',exact:true}).click()
      await page.getByRole('button',{name:button,exact:true}).click()
      await page.getByRole('heading',{name:heading,exact:true}).waitFor()
      await back(); await page.getByRole('heading',{name:'HỒ SƠ',exact:true}).waitFor()
      await back(); await page.locator('.home-player').waitFor()
    }
    await page.getByRole('button',{name:'CỬA HÀNG',exact:true}).click()
    await page.getByRole('tab',{name:'ĐIỆN THOẠI',exact:true}).click()
    const purchaseBefore = await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress'))
    await page.locator('[data-item-id="life-phone-daily"]').getByRole('button',{name:'MUA',exact:true}).click()
    await back(); assert.equal(await page.locator('dialog[open]').count(),0)
    assert.equal(await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress')),purchaseBefore)
    await back(); await page.locator('.home-player').waitFor()
    assert.equal(await page.evaluate(() => window.__nativeQA.listeners.size),3)
    console.log('PASS: MOCK-BRIDGE lifestyle history and Back cancels purchase without spending or extra native listeners')
    // Back cancels destructive dialogs; it must not reset data or leave the screen.
    const untouched = await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress'))
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await page.locator('.save-data-panel summary').click()
    await page.getByRole('button', { name: 'ĐẶT LẠI TIẾN TRÌNH', exact: true }).click()
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
    for (const name of ['Bán nước mía', 'Phụ hồ', 'Shipper', 'Bán hủ tiếu', 'Cắt tóc', 'Rửa xe', 'Cạo cao su', 'Sửa xe', 'Pha cà phê', 'Đánh cá', 'Bán bánh mì', 'Đổ xăng', 'Bốc hàng', 'Quét đường', 'Thợ điện', 'Bán hoa', 'Bảo vệ', 'Chụp ảnh', 'Thu ngân', 'Thu hoạch trái cây', 'Lập trình viên', 'Kế toán', 'Công an', 'Bác sĩ', 'Giáo viên', 'Tài xế']) {
      await page.getByRole('button', { name: 'KHÁM PHÁ THỊ TRẤN', exact: true }).click()
      await page.locator('.town-directory summary').click()
      await page.getByRole('button', { name: `Chọn ${name}`, exact: true }).click(); await page.clock.runFor(650)
      await page.getByRole('dialog').getByRole('button', { name: 'ĐI LÀM', exact: true }).click()
      await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
      await page.getByRole('button', { name: 'BẮT ĐẦU', exact: true }).click()
      await page.clock.runFor(4000); await page.locator('canvas').waitFor()
      await page.waitForFunction(() => window.__nativeQA.game?.deref()?.scene?.getScenes(true).length > 0)
      await back(); await page.locator('.native-pause[open]').waitFor()
      await page.clock.runFor(100)
      await page.waitForFunction(() => { const game = window.__nativeQA.game?.deref(); return game?.isPaused && !game.loop.running })
      // A locator screenshot also captures the modal/backdrop above the canvas.
      // Isolate the canvas pixels, not the dialog compositor/blur animation.
      // Remove CSS clipping only for capture: rounded-edge compositor pixels
      // can vary by 1 RGB value although the engine/frame are fully asleep.
      const captureOptions = { animations: 'disabled', style: '.native-pause { visibility: hidden !important; } .native-pause::backdrop { background: transparent !important; backdrop-filter: none !important; } .game-canvas-frame, .game-canvas-frame canvas { border-radius: 0 !important; overflow: visible !important; }' }
      const engineState = () => page.evaluate(() => {
        const game = window.__nativeQA.game.deref(), scene = game.scene.getScenes(true)[0]
        return { paused: game.isPaused, running: game.loop.running, frame: game.loop.frame, score: scene.score, remaining: scene.remainingGameMs ?? scene.remainingMs }
      })
      const pausedState = await engineState()
      const frozen = await page.locator('canvas').screenshot(captureOptions)
      await page.clock.runFor(2000)
      const afterPause = await page.locator('canvas').screenshot(captureOptions)
      assert.deepEqual(await engineState(), pausedState, `${name}: engine/timer/score changed during native pause`)
      if (!afterPause.equals(frozen)) {
        const fs = require('node:fs/promises')
        await fs.mkdir('node_modules/.tmp/task-22d', { recursive: true })
        await fs.writeFile('node_modules/.tmp/task-22d/pause-before.png', frozen)
        await fs.writeFile('node_modules/.tmp/task-22d/pause-after.png', afterPause)
        console.error('Paused engine:', await page.evaluate(() => { const game = window.__nativeQA.game.deref(); const scene = game.scene.getScenes(true)[0]; return { paused: game.isPaused, running: game.loop.running, frame: game.loop.frame, score: scene.score, remaining: scene.remainingGameMs ?? scene.remainingMs } }))
      }
      assert.ok(afterPause.equals(frozen), `${name}: engine must not render during native pause`)
      await page.getByRole('button', { name: 'TIẾP TỤC', exact: true }).click()
      await page.clock.runFor(1000)
      assert.equal(await page.locator('canvas').count(), 1)
      await page.evaluate(() => window.__nativeQA.emit('pause'))
      await page.locator('.native-pause[open]').waitFor()
      await page.getByRole('button', { name: 'RỜI CA', exact: true }).click()
      await page.locator('.town-content').waitFor(); await page.clock.runFor(32)
      assert.equal(await page.locator('canvas').count(), 0)
      await back(); await page.locator('.home-player').waitFor()
      console.log(`PASS: MOCK-BRIDGE ${name} pause/resume/back/teardown`)
    }
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')).state.totalGamesPlayed), before)
    assert.deepEqual(errors, [])
    console.log('PASS: MOCK-BRIDGE browser integration (not device): no native SW/install CTA, Back editing/dialog/history/minimize, twenty-six games freeze/resume, clean paused teardown and no false results')
  } finally { await context.close() }
}
module.exports = { verifyNativeAdapter }
