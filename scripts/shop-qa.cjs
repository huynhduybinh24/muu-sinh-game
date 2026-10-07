const assert = require('node:assert/strict')
const path = require('node:path')
const { dismissReward } = require('./profile-qa.cjs')

const sizes = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 412, height: 915 }]
const readSave = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')))

async function verifyShopFlows(browser, origin, artifacts, assertLayout, baseState) {
  const context = await browser.newContext({ viewport: sizes[1], hasTouch: true, isMobile: true, acceptDownloads: true })
  const errors = []
  try {
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    const { ownedItemIds: _items, totalMoneySpent: _spent, xp: _xp,
      dailyMissions: _missions, totalDailyMissionsClaimed: _claims, dailyRewardStreak: _streak,
      dailyRewardCycleDay: _day, lastDailyRewardDate: _date, ...legacy } = baseState
    Object.assign(legacy, {
      money: 2_000_000, totalGamesPlayed: 40,
      profile: { playerName: 'Thợ sành điệu', createdAt: '2026-10-01', appearance: {
        gender: 'female', skinToneId: 'deep', hairId: 'bun', shirtId: 'lavender', pantsId: 'forest',
      } },
    })
    await page.addInitScript((state) => {
      if (!localStorage.getItem('muu-sinh-player-progress')) {
        localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 3, state }))
      }
    }, legacy)
    await page.goto(origin)
    await page.locator('.home-player').waitFor()
    await dismissReward(page)
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    await page.reload()
    await page.locator('.home-player').waitFor()
    await dismissReward(page)
    const migrated = await readSave(page)
    assert.equal(migrated.version, 5)
    assert.equal(migrated.state.money, legacy.money)
    assert.equal(migrated.state.xp, 900)
    assert.deepEqual(migrated.state.profile, legacy.profile)
    assert.ok(['hair-bun', 'shirt-lavender', 'pants-forest'].every((id) => migrated.state.ownedItemIds.includes(id)))
    assert.equal(migrated.state.totalMoneySpent, 0)
    await page.getByRole('button', { name: 'CỬA HÀNG', exact: true }).click()
    await page.getByRole('heading', { name: 'CỬA HÀNG', exact: true }).waitFor()
    for (const size of sizes) {
      await page.setViewportSize(size)
      for (const [tab, count] of [['TÓC', 6], ['ÁO', 10], ['QUẦN', 6]]) {
        await page.getByRole('tab', { name: tab, exact: true }).click()
        assert.equal(await page.locator('.shop-item').count(), count)
        await page.locator('.shop-item').last().scrollIntoViewIfNeeded()
        await assertLayout(page, `Shop ${tab} ${size.width}`)
        await page.screenshot({ path: path.join(artifacts, `shop-${tab}-${size.width}.png`), fullPage: true, animations: 'disabled' })
      }
      await page.locator('.bottom-nav').scrollIntoViewIfNeeded()
      assert.equal(await page.locator('.bottom-nav button').count(), 3)
    }
    await page.setViewportSize(sizes[1])
    await page.getByRole('tab', { name: 'ÁO', exact: true }).click()
    const rose = page.locator('[data-item-id="shirt-rose"]')
    const beforePreview = await readSave(page)
    await rose.getByRole('button', { name: 'Xem thử Hồng ánh mai', exact: true }).click()
    assert.deepEqual(await readSave(page), beforePreview, 'Preview changed stored equipment')
    assert.ok((await page.locator('.shop-identity svg').innerHTML()).includes('#e6a1b7'))
    await rose.getByRole('button', { name: 'MUA', exact: true }).click()
    const bought = await readSave(page)
    assert.equal(bought.state.money, 1_250_000)
    assert.equal(bought.state.totalMoneySpent, 750_000)
    assert.equal(bought.state.ownedItemIds.filter((id) => id === 'shirt-rose').length, 1)
    assert.equal(bought.state.profile.appearance.shirtId, 'lavender')
    assert.ok(bought.state.achievements.some((unlock) => unlock.id === 'shopping-500k'))
    await rose.getByRole('button', { name: 'TRANG BỊ', exact: true }).click()
    assert.equal(await rose.getByRole('button', { name: 'ĐANG DÙNG', exact: true }).isDisabled(), true)
    assert.equal((await readSave(page)).state.money, bought.state.money)
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    assert.ok((await page.locator('.home-player svg').innerHTML()).includes('#e6a1b7'))
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    assert.ok((await page.locator('.profile-identity svg').innerHTML()).includes('#e6a1b7'))
    await page.getByRole('button', { name: 'TỦ ĐỒ', exact: true }).click()
    for (const size of sizes) {
      await page.setViewportSize(size)
      for (const tab of ['TÓC', 'ÁO', 'QUẦN']) {
        await page.getByRole('tab', { name: tab, exact: true }).click()
        const ids = await page.locator('.shop-item').evaluateAll((elements) => elements.map((element) => element.dataset.itemId))
        assert.ok(ids.every((id) => bought.state.ownedItemIds.includes(id)))
        assert.equal(await page.getByRole('button', { name: 'MUA', exact: true }).count(), 0)
        await assertLayout(page, `Wardrobe ${tab} ${size.width}`)
        await page.screenshot({ path: path.join(artifacts, `wardrobe-${tab}-${size.width}.png`), fullPage: true, animations: 'disabled' })
      }
    }
    await page.getByRole('tab', { name: 'ÁO', exact: true }).click()
    await page.locator('[data-item-id="shirt-mint"]').getByRole('button', { name: 'TRANG BỊ', exact: true }).click()
    assert.equal((await readSave(page)).state.profile.appearance.shirtId, 'mint')
    assert.equal((await readSave(page)).state.money, bought.state.money)
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await page.getByRole('button', { name: 'CHỈNH SỬA NHÂN VẬT', exact: true }).click()
    assert.equal(await page.getByRole('region', { name: 'Áo', exact: true }).locator('.option-heading small').innerText(), '2/4')
    await page.getByRole('button', { name: 'HỦY THAY ĐỔI', exact: true }).click()
    await context.setOffline(true)
    await page.reload()
    await page.locator('.home-player').waitFor()
    await dismissReward(page)
    const beforeOffline = await readSave(page)
    await page.getByRole('button', { name: 'CỬA HÀNG', exact: true }).click()
    await page.getByRole('tab', { name: 'ÁO', exact: true }).click()
    const blue = page.locator('[data-item-id="shirt-blue"]')
    await blue.getByRole('button', { name: 'MUA', exact: true }).click()
    await blue.getByRole('button', { name: 'TRANG BỊ', exact: true }).click()
    const offline = await readSave(page)
    assert.equal(offline.state.money, beforeOffline.state.money - 20_000)
    assert.equal(offline.state.profile.appearance.shirtId, 'blue')
    await page.reload()
    await page.locator('.home-player').waitFor()
    assert.deepEqual(await readSave(page), offline)
    assert.deepEqual(errors, [])
    console.log('PASS: v3 paid-outfit migration/level, 22 shop items, 3 mobile sizes/tabs/scrolling, preview, buy/equip, wardrobe, achievements and offline persistence')
  } finally { await context.close() }
}
module.exports = { verifyShopFlows }
