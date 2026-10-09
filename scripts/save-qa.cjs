const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { dismissReward } = require('./profile-qa.cjs')
const sizes = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 412, height: 915 }]
const readSave = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')))
const readSlot = (page) => page.evaluate(() => localStorage.getItem('muu-sinh-backup'))
const upload = (page, value, name = 'backup.json') => page.getByLabel('Chọn file sao lưu JSON').setInputFiles({ name,
  mimeType: 'application/json', buffer: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value), 'utf8') })
async function openData(page) {
  await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
  await page.locator('.save-data-panel summary').click()
}
async function verifySaveFlows(browser, origin, artifacts, assertLayout, baseState) {
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
    await page.locator('.home-player').waitFor()
    await dismissReward(page)
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    await openData(page)
    const original = await readSave(page), originalSlot = await readSlot(page)
    for (const size of sizes) {
      await page.setViewportSize(size)
      await page.locator('.screen-footer').scrollIntoViewIfNeeded()
      await assertLayout(page, 'Save tools')
      await page.screenshot({ path: path.join(artifacts, `save-tools-${size.width}.png`), fullPage: true, animations: 'disabled' })
    }
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'TẢI FILE SAO LƯU', exact: true }).click()
    const download = await downloadPromise
    assert.equal(download.suggestedFilename(), 'muu-sinh-save-2026-10-07.json')
    const filePath = path.join(artifacts, download.suggestedFilename())
    await download.saveAs(filePath)
    const backup = JSON.parse(await fs.readFile(filePath, 'utf8'))
    assert.deepEqual(Object.keys(backup), ['format', 'version', 'exportedAt', 'data'])
    assert.equal(backup.format, 'muu-sinh-save')
    assert.equal(backup.version, 5)
    assert.deepEqual(backup.data, original.state)
    assert.deepEqual(await readSave(page), original)
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    await page.getByRole('button', { name: 'XEM TẤT CẢ', exact: true }).click()
    const missions = await page.locator('.daily-mission-card').evaluateAll((cards) => cards.map((card) => ({ id: card.dataset.missionId,
      progress: Number(card.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')), claimed: true })))
    await openData(page)
    const target = structuredClone(backup)
    Object.assign(target.data, {
      profile: { playerName: 'Thợ khôi phục', createdAt: '2026-10-01T05:00:00Z', appearance: {
        gender: 'female', skinToneId: 'deep', hairId: 'long', shirtId: 'rose', pantsId: 'plum',
      } }, money: 1_250_000, xp: 900, reputation: 55, totalMoneySpent: 750_000, totalGamesPlayed: 12,
      totalDaysWorked: 5, currentStreak: 3, bestStreak: 3, lastCompletedDate: '2026-10-07', totalMoneyEarned: 1_500_000,
      ownedItemIds: [...backup.data.ownedItemIds, 'hair-long', 'shirt-rose', 'pants-plum'],
      completedJobs: ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash'],
      completedTutorials: ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash'], soundEnabled: false,
      dailyMissions: { dateKey: '2026-10-07', missions }, totalDailyMissionsClaimed: 30,
      dailyRewardStreak: 7, dailyRewardCycleDay: 7, lastDailyRewardDate: '2026-10-07',
      achievements: ['first-day', 'missions-day', 'reward-7'].map((id) => ({ id, unlockedAt: '2026-10-07T05:00:00Z' })),
      jobStats: { ...backup.data.jobStats, ...Object.fromEntries(['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash']
        .map((id) => [id, { timesPlayed: 2, bestScore: 1500, totalScore: 2800, totalMoneyEarned: 250_000 }])) },
    })
    await upload(page, target)
    await page.getByRole('dialog', { name: 'KHÔI PHỤC DỮ LIỆU?' }).waitFor()
    assert.deepEqual(await readSave(page), original, 'Selecting a backup changed current data')
    assert.equal(await readSlot(page), originalSlot, 'Preview must not alter recovery slot')
    assert.equal(await page.getByRole('dialog').getByText('Thợ khôi phục', { exact: true }).count(), 1)
    for (const size of sizes) {
      await page.setViewportSize(size)
      await assertLayout(page, 'Restore preview')
      const bounds = await page.getByRole('dialog').boundingBox()
      assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.y + bounds.height <= size.height)
      await page.screenshot({ path: path.join(artifacts, `restore-preview-${size.width}.png`), animations: 'disabled' })
    }
    await page.getByRole('button', { name: 'HỦY', exact: true }).click()
    assert.deepEqual(await readSave(page), original)
    assert.equal(await readSlot(page), originalSlot)
    for (const invalid of ['{broken', { ...target, format: 'other' }, { ...target, version: 6 }, { ...target, data: { ...target.data, money: -1 } }]) {
      await upload(page, invalid)
      await page.getByText(typeof invalid === 'object' && invalid.version === 6
        ? 'File sao lưu được tạo bởi phiên bản game mới hơn.' : 'File sao lưu không hợp lệ.', { exact: true }).waitFor()
      assert.equal(await page.getByRole('dialog').count(), 0)
      assert.deepEqual(await readSave(page), original)
    }
    await context.setOffline(true)
    await upload(page, target)
    await page.getByRole('dialog').getByRole('button', { name: 'KHÔI PHỤC', exact: true }).click()
    await page.locator('.home-player').waitFor()
    const restored = await readSave(page)
    assert.deepEqual(restored.state, target.data)
    assert.deepEqual(JSON.parse(await readSlot(page)).data, original.state)
    assert.equal(await page.locator('.home-player h2').innerText(), target.data.profile.playerName)
    assert.equal(await page.locator('.home-player .level-badge').innerText(), 'CẤP 5')
    assert.equal(await page.getByRole('dialog').count(), 0, 'Claimed daily gift should not reopen after restore')
    await page.reload()
    await page.locator('.home-player').waitFor()
    assert.deepEqual(await readSave(page), restored)
    assert.equal(await page.locator('.level-up-toast').count(), 0)
    await page.getByRole('button', { name: 'XEM TẤT CẢ', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: '✓ ĐÃ NHẬN', exact: true }).count(), 3)
    await page.getByRole('button', { name: 'SỰ NGHIỆP', exact: true }).click()
    assert.equal(await page.locator('.career-job-card').count(), 26)
    assert.equal(await page.getByText('Mở khóa 7/10/2026').count(), 3)
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    await page.getByRole('button', { name: 'CỬA HÀNG', exact: true }).click()
    await page.getByRole('tab', { name: 'ÁO', exact: true }).click()
    assert.equal(await page.locator('[data-item-id="shirt-rose"]').getByRole('button', { name: 'ĐANG DÙNG', exact: true }).count(), 1)
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await page.getByRole('button', { name: 'TỦ ĐỒ', exact: true }).click()
    await page.getByRole('tab', { name: 'ÁO', exact: true }).click()
    assert.equal(await page.locator('.shop-item').count(), 3)
    await openData(page)
    const offlineDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'TẢI FILE SAO LƯU', exact: true }).click()
    const offlineFile = await offlineDownload
    const offlinePath = path.join(artifacts, 'offline-save.json')
    await offlineFile.saveAs(offlinePath)
    assert.deepEqual(JSON.parse(await fs.readFile(offlinePath, 'utf8')).data, target.data)
    await page.getByRole('button', { name: 'ĐẶT LẠI TIẾN TRÌNH', exact: true }).click()
    await page.getByRole('dialog', { name: 'ĐẶT LẠI TIẾN TRÌNH?' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'ĐẶT LẠI', exact: true }).isDisabled(), true)
    assert.ok((await page.locator('.save-warning').innerText()).includes('Một bản recovery cục bộ'))
    assert.deepEqual(await readSave(page), restored)
    await page.getByRole('button', { name: 'HỦY', exact: true }).click()
    assert.deepEqual(await readSave(page), restored)
    await page.getByRole('button', { name: 'ĐẶT LẠI TIẾN TRÌNH', exact: true }).click()
    await page.getByLabel('Nhập XÓA để xác nhận').fill('XÓA')
    await page.getByRole('button', { name: 'ĐẶT LẠI', exact: true }).click()
    await page.getByLabel('Bạn tên gì?', { exact: true }).waitFor()
    const reset = await readSave(page)
    assert.equal(reset.state.profile.playerName, '')
    assert.equal(reset.state.money, 0)
    assert.equal(reset.state.ownedItemIds.length, 6)
    assert.deepEqual(JSON.parse(await readSlot(page)).data, target.data)
    assert.deepEqual(errors, [])
    console.log('PASS: UTF-8 export/filename, preview/cancel, invalid/future files, offline atomic restore/refresh, profile/avatar/inventory/Career/achievements/daily state, offline export and deliberate reset/recovery')
  } finally { await context.close() }
}
module.exports = { verifySaveFlows }
