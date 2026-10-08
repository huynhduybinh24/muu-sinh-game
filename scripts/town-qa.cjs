const assert = require('node:assert/strict')
const path = require('node:path')
const { dismissReward } = require('./profile-qa.cjs')
const jobs = [
  ['sugarcane', 'Bán nước mía'], ['construction', 'Phụ hồ'], ['shipper', 'Shipper'], ['noodle', 'Bán hủ tiếu'], ['barber', 'Cắt tóc'],
  ['carwash', 'Rửa xe'], ['rubber', 'Cạo cao su'], ['mechanic', 'Sửa xe'], ['coffee', 'Pha cà phê'], ['fishing', 'Đánh cá'],
]
const sizes = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 412, height: 915 }, { width: 1280, height: 900 }]
const readSave = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')))
const openTown = async (page) => { await dismissReward(page); await page.getByRole('button', { name: 'KHÁM PHÁ THỊ TRẤN', exact: true }).click(); await page.locator('.town-scroll').waitFor() }
async function selectMap(page, id) {
  const marker = page.locator(`.town-location[data-job-id="${id}"]`)
  await marker.scrollIntoViewIfNeeded()
  await marker.click()
  await page.clock.runFor(650)
  await page.getByRole('dialog').waitFor()
}
async function verifyTownFlows(browser, origin, artifacts, assertLayout, baseState) {
  const context = await browser.newContext({ viewport: sizes[1], hasTouch: true, isMobile: true, acceptDownloads: true, timezoneId: 'Asia/Ho_Chi_Minh' })
  const errors = []
  try {
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.clock.install({ time: new Date('2026-10-07T05:00:00Z') })
    await page.addInitScript((state) => {
      if (!localStorage.getItem('muu-sinh-player-progress')) localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 5, state }))
    }, baseState)
    await page.goto(origin)
    await page.locator('.home-player').waitFor(); await dismissReward(page)
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    const before = await readSave(page)
    const homeAvatar = await page.locator('.home-player .player-avatar svg').innerHTML()
    await openTown(page)
    assert.equal(await page.locator('.town-location').count(), 10)
    assert.equal(await page.locator('.town-location[data-daily="true"]').getAttribute('data-job-id'), 'sugarcane')
    assert.equal(await page.locator('canvas').count(), 0)
    assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some(({ name }) => /\/GamePage-.*\.js/.test(name))), false, 'Town must not load gameplay JS into the page')
    assert.equal(await page.locator('.town-player .player-avatar svg').innerHTML(), homeAvatar)
    for (const size of sizes) {
      await page.setViewportSize(size); await assertLayout(page, 'Town')
      await page.screenshot({ path: path.join(artifacts, `town-${size.width}.png`), animations: 'disabled' })
    }
    await page.setViewportSize(sizes[1])
    // Actual native touch scroll inside the map, not a React drag handler.
    await page.locator('.town-scroll').evaluate((element) => { element.scrollTop = 0; element.scrollLeft = 150 })
    const bounds = await page.locator('.town-scroll').boundingBox()
    const touch = await context.newCDPSession(page)
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - 20, id: 1 }] })
    for (let i = 1; i <= 8; i++) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - 20 - i * 28, id: 1 }] })
      await page.clock.runFor(32)
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await touch.detach()
    await page.clock.runFor(300)
    assert.ok(await page.locator('.town-scroll').evaluate((element) => element.scrollTop > 0), 'Touch must pan the map')
    for (const [id, name] of jobs) {
      await selectMap(page, id)
      assert.equal(await page.getByRole('dialog').getByRole('heading', { name, exact: true }).count(), 1)
      assert.equal(await page.locator(`.town-location[data-job-id="${id}"]`).getAttribute('aria-pressed'), 'true')
      const position = await page.locator('.town-player').evaluate((element) => ({ x: Number(element.dataset.x), y: Number(element.dataset.y), transform: getComputedStyle(element).transform }))
      assert.ok(position.x > 0 && position.y > 100)
      await assertLayout(page, `Town panel ${id}`)
      await page.screenshot({ path: path.join(artifacts, `town-panel-${id}.png`), animations: 'disabled' })
      await page.getByRole('button', { name: 'ĐÓNG', exact: true }).click()
    }
    assert.deepEqual(await readSave(page), before, 'Exploring locations must not change progress')
    console.log('PASS: Town mobile/desktop layout, native touch pan, ten panels, saved avatar and unchanged exploration progress')
    await page.locator('.town-directory summary').click()
    assert.equal(await page.locator('.town-directory button').count(), 10)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Chọn Đánh cá', exact: true }).click()
    await page.getByRole('dialog').waitFor()
    assert.equal(await page.locator('.town-player').evaluate((element) => getComputedStyle(element).transitionDuration), '0s')
    await page.getByRole('button', { name: 'ĐÓNG', exact: true }).click()
    await context.setOffline(true)
    // All ten are immediately reachable through the existing reveal flow, before Nov activation.
    for (const [id, name] of jobs) {
      await page.getByRole('button', { name: `Chọn ${name}`, exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'ĐI LÀM', exact: true }).click()
      await page.locator('.job-name').waitFor()
      assert.equal(await page.locator('.job-name').innerText(), name)
      assert.equal((await readSave(page)).state.currentJobId, id)
      assert.equal(await page.locator('canvas').count(), 0)
      await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
      await page.getByRole('button', { name: 'BẮT ĐẦU', exact: true }).click()
      await page.clock.runFor(4000)
      await page.locator('canvas').waitFor()
      assert.equal(await page.locator('canvas').count(), 1)
      assert.equal(await page.locator('.game-heading h1').innerText(), name)
      await page.reload(); await page.locator('.home-player').waitFor(); await openTown(page)
      await page.locator('.town-directory summary').click()
      assert.equal(await page.locator('canvas').count(), 0)
    }
    console.log('PASS: Town launches all ten mini-games offline before November activation, with one canvas and clean navigation')
    // Free play of today's job must never falsely complete Daily, even after replay.
    await page.getByRole('button', { name: 'Chọn Bán nước mía', exact: true }).click()
    assert.equal(await page.getByRole('radio', { name: 'Chơi tự do', exact: true }).isChecked(), true)
    await page.getByRole('dialog').getByRole('button', { name: 'ĐI LÀM', exact: true }).click()
    await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
    // Tutorial was completed during the ten-job launch check; replay uses intro/countdown.
    await page.clock.runFor(4000); await page.locator('canvas').waitFor()
    assert.equal(await page.locator('canvas').count(), 1)
    await page.clock.runFor(45_000); await page.locator('.share-card-preview').waitFor()
    const free = (await readSave(page)).state
    assert.equal(free.totalDaysWorked, before.state.totalDaysWorked)
    assert.equal(free.currentStreak, before.state.currentStreak)
    assert.equal(free.jobStats.sugarcane.timesPlayed, before.state.jobStats.sugarcane.timesPlayed + 1)
    assert.equal(free.xp, before.state.xp + 30)
    assert.equal(await page.locator('canvas').count(), 0)
    console.log('PASS: Town free-play result awards XP/Career without completing Daily')
    await page.getByRole('button', { name: 'CHƠI LẠI', exact: true }).click()
    await page.clock.runFor(4000); await page.locator('canvas').waitFor(); assert.equal(await page.locator('canvas').count(), 1)
    await page.clock.runFor(45_000); await page.locator('.share-card-preview').waitFor()
    const replay = (await readSave(page)).state
    assert.equal(replay.totalDaysWorked, before.state.totalDaysWorked)
    assert.equal(replay.totalGamesPlayed, free.totalGamesPlayed + 1)
    await page.getByRole('button', { name: 'VỀ TRANG CHỦ →', exact: true }).click(); await openTown(page)
    await selectMap(page, 'sugarcane'); await page.getByRole('radio', { name: 'Nghề hôm nay', exact: true }).check()
    await page.getByRole('dialog').getByRole('button', { name: 'ĐI LÀM', exact: true }).click()
    await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
    await page.clock.runFor(4000); await page.locator('canvas').waitFor(); await page.clock.runFor(45_000)
    await page.locator('.share-card-preview').waitFor()
    const daily = (await readSave(page)).state
    assert.equal(daily.totalDaysWorked, before.state.totalDaysWorked + 1)
    assert.equal(daily.currentStreak, 1)
    await page.getByRole('button', { name: 'VỀ TRANG CHỦ →', exact: true }).click()
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await page.getByRole('button', { name: 'CHỈNH SỬA NHÂN VẬT', exact: true }).click()
    await page.getByRole('button', { name: 'Áo tiếp theo', exact: true }).click()
    await page.getByRole('button', { name: 'HOÀN TẤT ✓', exact: true }).click()
    const newAvatar = await page.locator('.profile-identity .player-avatar svg').innerHTML()
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click(); await openTown(page)
    assert.equal(await page.locator('.town-player .player-avatar svg').innerHTML(), newAvatar)
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    await page.getByRole('button', { name: 'CỬA HÀNG', exact: true }).click()
    await page.getByRole('tab', { name: 'ÁO', exact: true }).click()
    const wardrobe = (await readSave(page)).state
    const otherShirt = wardrobe.ownedItemIds.find((id) => id.startsWith('shirt-') && id !== `shirt-${wardrobe.profile.appearance.shirtId}`)
    assert.ok(otherShirt, 'Fixture must have another owned starter shirt')
    await page.locator(`[data-item-id="${otherShirt}"]`).getByRole('button', { name: 'TRANG BỊ', exact: true }).click()
    const equippedAvatar = await page.locator('.shop-identity .player-avatar svg').innerHTML()
    assert.notEqual(equippedAvatar, newAvatar)
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click(); await openTown(page)
    assert.equal(await page.locator('.town-player .player-avatar svg').innerHTML(), equippedAvatar)
    await page.getByRole('button', { name: 'SỰ NGHIỆP', exact: true }).click()
    assert.equal(await page.locator('.career-job-card').count(), 10)
    assert.deepEqual(errors, [])
    console.log('PASS: Town 10 locations/5 districts, touch pan, mobile/desktop, panels/avatar travel, accessible list/reduced motion, lazy Phaser, offline routing, free/replay vs daily, Career and Profile/Shop avatar')
  } finally { await context.close() }
}
module.exports = { verifyTownFlows }
