const assert = require('node:assert/strict')
const path = require('node:path')
const { dismissReward } = require('./profile-qa.cjs')
const sizes = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 412, height: 915 }]
const readSave = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')))
const career = (state) => ({ jobStats: state.jobStats, totalMoneyEarned: state.totalMoneyEarned,
  totalGamesPlayed: state.totalGamesPlayed, totalDaysWorked: state.totalDaysWorked,
  currentStreak: state.currentStreak, bestStreak: state.bestStreak, lastCompletedDate: state.lastCompletedDate })

async function verifyDailyFlows(browser, origin, artifacts, assertLayout, baseState) {
  const context = await browser.newContext({ viewport: sizes[1], hasTouch: true, isMobile: true, timezoneId: 'Asia/Ho_Chi_Minh' })
  const errors = []
  try {
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.clock.install({ time: new Date('2026-10-07T05:00:00Z') })
    const { dailyMissions: _missions, totalDailyMissionsClaimed: _claims, dailyRewardStreak: _streak,
      dailyRewardCycleDay: _cycle, lastDailyRewardDate: _date, ...legacy } = baseState
    Object.assign(legacy, { money: 200_000, xp: 149, currentStreak: 4, bestStreak: 10, totalDaysWorked: 12,
      lastCompletedDate: '2026-10-06' })
    await page.addInitScript((state) => {
      if (!localStorage.getItem('muu-sinh-player-progress')) localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 4, state }))
    }, legacy)
    await page.goto(origin)
    await page.getByRole('dialog', { name: 'QUÀ HÔM NAY' }).waitFor()
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    const migrated = await readSave(page)
    assert.equal(migrated.version, 5)
    for (const key of Object.keys(legacy)) assert.deepEqual(migrated.state[key], legacy[key], `v4 migration changed ${key}`)
    assert.equal(migrated.state.dailyMissions.missions.length, 3)
    assert.equal(migrated.state.totalDailyMissionsClaimed, 0)
    for (const size of sizes) {
      await page.setViewportSize(size)
      await assertLayout(page, 'Daily reward modal')
      const dialog = await page.getByRole('dialog').boundingBox()
      assert.ok(dialog.x >= 0 && dialog.y >= 0 && dialog.y + dialog.height <= size.height)
      assert.equal(await page.locator('.daily-reward-strip li').count(), 7)
      await page.screenshot({ path: path.join(artifacts, `daily-reward-${size.width}.png`), animations: 'disabled' })
    }
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.deepEqual(await readSave(page), migrated, 'Closing gift must not grant it')
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    assert.equal(await page.getByRole('dialog').count(), 0, 'Dismissed gift reopened on navigation')
    await page.getByRole('button', { name: 'NHẬN QUÀ', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'NHẬN QUÀ', exact: true }).click()
    const firstGift = await readSave(page)
    assert.equal(firstGift.state.money, legacy.money + 5_000)
    assert.equal(firstGift.state.xp, legacy.xp)
    assert.deepEqual(career(firstGift.state), career(legacy))
    assert.equal(await page.locator('.home-reward-entry button').isDisabled(), true)
    await page.reload()
    await page.locator('.home-player').waitFor()
    assert.equal(await page.getByRole('dialog').count(), 0, 'Claimed gift reopened after refresh')
    for (const size of sizes) {
      await page.setViewportSize(size)
      await assertLayout(page, 'Daily Home')
      await page.screenshot({ path: path.join(artifacts, `daily-home-${size.width}.png`), fullPage: true, animations: 'disabled' })
    }
    await page.getByRole('button', { name: 'XEM TẤT CẢ', exact: true }).click()
    const definitions = await page.locator('.daily-mission-card').evaluateAll((cards) => cards.map((card) => ({
      id: card.dataset.missionId, target: Number(card.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')),
      title: card.querySelector('h2').textContent,
    })))
    assert.equal(definitions.length, 3)
    assert.equal(new Set(definitions.map((m) => m.id)).size, 3)
    assert.equal(await page.getByRole('button', { name: 'NHẬN THƯỞNG', exact: true }).filter({ visible: true }).count(), 3)
    assert.equal(await page.locator('.daily-mission-card button:disabled').count(), 3)
    for (const size of sizes) {
      await page.setViewportSize(size)
      await page.locator('.bottom-nav').scrollIntoViewIfNeeded()
      await assertLayout(page, 'Daily Missions')
      await page.screenshot({ path: path.join(artifacts, `daily-missions-${size.width}.png`), fullPage: true, animations: 'disabled' })
    }
    await context.setOffline(true)
    await page.reload()
    await page.locator('.home-player').waitFor()
    await page.getByRole('button', { name: 'XEM TẤT CẢ', exact: true }).click()
    assert.deepEqual(await page.locator('.daily-mission-card').evaluateAll((cards) => cards.map((card) => ({
      id: card.dataset.missionId, target: Number(card.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')),
      title: card.querySelector('h2').textContent,
    }))), definitions, 'Refresh/offline changed missions')
    // Isolated persisted fixture exercises real UI/store claims, without frontend debug globals.
    const fixture = (await readSave(page)).state
    fixture.totalDailyMissionsClaimed = 27
    fixture.dailyMissions.missions = definitions.map(({ id, target }) => ({ id, progress: target, claimed: false }))
    await page.evaluate((state) => localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 5, state })), fixture)
    await page.reload()
    await page.getByRole('button', { name: 'XEM TẤT CẢ', exact: true }).click()
    const firstCard = page.locator('.daily-mission-card').first()
    await firstCard.getByRole('button', { name: 'NHẬN THƯỞNG', exact: true }).click()
    await page.getByText('LÊN CẤP! LEVEL 2', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Đóng thông báo lên cấp', exact: true }).click()
    assert.equal(await firstCard.getByRole('button', { name: '✓ ĐÃ NHẬN', exact: true }).isDisabled(), true)
    while (await page.getByRole('button', { name: 'NHẬN THƯỞNG', exact: true }).count()) {
      await page.getByRole('button', { name: 'NHẬN THƯỞNG', exact: true }).first().click()
    }
    const allClaimed = await readSave(page)
    assert.equal(allClaimed.state.totalDailyMissionsClaimed, 30)
    assert.equal(allClaimed.state.dailyMissions.missions.filter((m) => m.claimed).length, 3)
    assert.deepEqual(career(allClaimed.state), career(fixture))
    assert.ok(allClaimed.state.money > fixture.money)
    assert.ok(allClaimed.state.xp > fixture.xp)
    assert.ok(['missions-day', 'missions-30'].every((id) => allClaimed.state.achievements.some((a) => a.id === id)))
    await page.reload()
    await page.locator('.home-player').waitFor()
    assert.deepEqual(await readSave(page), allClaimed)
    assert.equal(await page.locator('.level-up-toast').count(), 0)
    await page.getByRole('button', { name: 'XEM TẤT CẢ', exact: true }).click()
    assert.equal(await page.locator('.daily-mission-card button:disabled').count(), 3)
    await page.clock.setFixedTime(new Date('2026-10-08T05:00:00Z'))
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    await page.getByRole('dialog').waitFor()
    assert.equal((await readSave(page)).state.dailyMissions.dateKey, '2026-10-08')
    assert.ok((await readSave(page)).state.dailyMissions.missions.every((m) => m.progress === 0 && !m.claimed))
    await page.getByRole('dialog').getByRole('button', { name: 'NHẬN QUÀ', exact: true }).click()
    const second = (await readSave(page)).state
    assert.equal(second.money - allClaimed.state.money, 7_500)
    assert.equal(second.dailyRewardCycleDay, 2)
    assert.equal(second.currentStreak, legacy.currentStreak)
    await page.clock.setFixedTime(new Date('2026-10-10T05:00:00Z'))
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    await page.getByRole('dialog').waitFor()
    await page.getByRole('dialog').getByRole('button', { name: 'NHẬN QUÀ', exact: true }).click()
    const missed = (await readSave(page)).state
    assert.equal(missed.dailyRewardCycleDay, 1)
    assert.equal(missed.dailyRewardStreak, 1)
    assert.equal(missed.money - second.money, 5_000)
    const daySeven = { ...missed, xp: 140, lastDailyRewardDate: '2026-10-09', dailyRewardCycleDay: 6, dailyRewardStreak: 6 }
    await page.evaluate((state) => localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 5, state })), daySeven)
    await page.reload()
    await page.getByRole('dialog').waitFor()
    assert.equal(await page.getByRole('dialog').getByText('NGÀY 7 / 7', { exact: true }).count(), 1)
    await page.getByRole('dialog').getByRole('button', { name: 'NHẬN QUÀ', exact: true }).click()
    const seventh = await readSave(page)
    assert.equal(seventh.state.money, missed.money + 30_000)
    assert.equal(seventh.state.xp, 200)
    assert.ok(seventh.state.achievements.some((a) => a.id === 'reward-7'))
    await page.getByText('LÊN CẤP! LEVEL 2', { exact: true }).waitFor()
    await page.reload()
    await page.locator('.home-player').waitFor()
    assert.equal(await page.getByRole('dialog').count(), 0)
    assert.equal(await page.locator('.level-up-toast').count(), 0)
    assert.deepEqual(await readSave(page), seventh)
    await page.clock.setFixedTime(new Date('2026-10-11T05:00:00Z'))
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    await page.getByRole('dialog').waitFor()
    assert.equal(await page.getByRole('dialog').getByText('NGÀY 1 / 7', { exact: true }).count(), 1)
    await dismissReward(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'XEM TẤT CẢ', exact: true }).click()
    assert.equal(await page.locator('.mission-meter span').first().evaluate((element) => getComputedStyle(element).transitionDuration), '0s')
    assert.deepEqual(errors, [])
    console.log('PASS: v4 migration, 3 stable missions, mobile layouts, offline claims/refresh, mission and day-7 level-up, 3 achievements, midnight reset, separate work income/streak, daily cycle/missed day/wrap and reduced motion')
  } finally { await context.close() }
}
module.exports = { verifyDailyFlows }
