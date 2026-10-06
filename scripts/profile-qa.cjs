const assert = require('node:assert/strict')
const path = require('node:path')

const sizes = [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 412, height: 915 }]
const optionGroups = [
  ['Giới tính', 2], ['Màu da', 4], ['Kiểu tóc', 6], ['Áo', 6], ['Quần', 4],
]
const readSave = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('muu-sinh-player-progress')))
const withoutProfile = ({ profile: _profile, ...progress }) => progress

async function completeProfile(page, name) {
  await page.getByLabel('Bạn tên gì?', { exact: true }).fill(name)
  await page.getByRole('button', { name: 'TIẾP TỤC →', exact: true }).click()
  await page.getByRole('heading', { name: 'TẠO NHÂN VẬT', exact: true }).waitFor()
  await page.getByRole('button', { name: 'HOÀN TẤT ✓', exact: true }).click()
  await page.locator('.home-player').waitFor()
}

async function captureSizes(page, label, artifacts, assertLayout) {
  for (const size of sizes) {
    await page.setViewportSize(size)
    await assertLayout(page, label)
    await page.screenshot({ path: path.join(artifacts, `profile-${label}-${size.width}.png`), fullPage: true, animations: 'disabled' })
    const footer = page.locator('.screen-footer')
    const controls = await footer.count() ? await footer.boundingBox() : null
    if (controls && label !== 'Career') {
      assert.ok(controls.y + controls.height <= size.height + 1, `${label}: footer ends at ${controls.y + controls.height} below ${size.height}px viewport at ${size.width}`)
    }
  }
}

async function verifyProfileFlows(browser, page, origin, artifacts, assertLayout) {
  await page.getByLabel('Bạn tên gì?', { exact: true }).waitFor()
  await captureSizes(page, 'welcome', artifacts, assertLayout)
  const input = page.getByLabel('Bạn tên gì?', { exact: true })
  for (const invalid of ['', 'A', 'A'.repeat(21)]) {
    await input.fill(invalid)
    await page.getByRole('button', { name: 'TIẾP TỤC →', exact: true }).click()
    await page.getByRole('alert').waitFor()
    assert.equal(await page.getByRole('heading', { name: 'TẠO NHÂN VẬT', exact: true }).count(), 0)
  }
  await input.fill('  Nguyễn Ánh  ')
  await page.getByRole('button', { name: 'TIẾP TỤC →', exact: true }).click()
  await page.getByRole('heading', { name: 'TẠO NHÂN VẬT', exact: true }).waitFor()
  await captureSizes(page, 'creator', artifacts, assertLayout)
  for (const [label, count] of optionGroups) {
    const group = page.getByRole('region', { name: label, exact: true })
    const original = await group.locator('.option-picker > span').innerText()
    const firstAvatar = await page.locator('.player-avatar svg').innerHTML()
    await page.getByRole('button', { name: `${label} tiếp theo`, exact: true }).click()
    assert.notEqual(await page.locator('.player-avatar svg').innerHTML(), firstAvatar, `${label}: preview unchanged`)
    for (let step = 1; step < count; step++) {
      await page.getByRole('button', { name: `${label} tiếp theo`, exact: true }).click()
    }
    assert.equal(await group.locator('.option-picker > span').innerText(), original, `${label}: wraparound failed`)
    await page.getByRole('button', { name: `${label} trước`, exact: true }).click()
    assert.notEqual(await group.locator('.option-picker > span').innerText(), original)
  }
  await page.getByRole('button', { name: 'HOÀN TẤT ✓', exact: true }).click()
  await page.locator('.home-player').waitFor()
  assert.equal(await page.locator('.home-player h2').innerText(), 'Nguyễn Ánh')
  const created = (await readSave(page)).state
  assert.equal((await readSave(page)).version, 3)
  assert.ok(Number.isFinite(Date.parse(created.profile.createdAt)))
  await captureSizes(page, 'home', artifacts, assertLayout)
  await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
  await captureSizes(page, 'profile', artifacts, assertLayout)
  assert.equal(await page.locator('.profile-stats .stat-value').first().innerText(), '0')
  await page.getByRole('button', { name: 'CHỈNH SỬA NHÂN VẬT', exact: true }).click()
  await page.getByRole('button', { name: 'Áo tiếp theo', exact: true }).click()
  await page.getByRole('button', { name: 'HỦY THAY ĐỔI', exact: true }).click()
  assert.deepEqual((await readSave(page)).state, created, 'Cancel changed saved appearance')
  await page.getByRole('button', { name: 'CHỈNH SỬA NHÂN VẬT', exact: true }).click()
  await page.getByRole('button', { name: 'Áo tiếp theo', exact: true }).click()
  await page.getByRole('button', { name: 'HOÀN TẤT ✓', exact: true }).click()
  const edited = (await readSave(page)).state
  assert.notDeepEqual(edited.profile.appearance, created.profile.appearance)
  assert.deepEqual(withoutProfile(edited), withoutProfile(created))
  assert.equal(edited.profile.createdAt, created.profile.createdAt)
  await page.reload()
  await page.locator('.home-player').waitFor()
  assert.equal(await page.getByLabel('Bạn tên gì?', { exact: true }).count(), 0)
  assert.deepEqual((await readSave(page)).state, edited)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('.avatar-figure').evaluate((element) => getComputedStyle(element).animationName), 'none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  console.log('PASS: new-player name validation, all avatar options, cancellation/editing, persistence, reduced motion, and 3 mobile layouts')

  const legacyContext = await browser.newContext({ viewport: sizes[0], hasTouch: true, isMobile: true })
  try {
    const legacy = withoutProfile(created)
    Object.assign(legacy, {
      money: 450000, reputation: 30, energy: 40, currentStreak: 3, bestStreak: 8,
      totalGamesPlayed: 18, totalDaysWorked: 12, totalMoneyEarned: 900000,
      lastCompletedDate: '2026-10-06', currentJobId: 'shipper', previousJobId: 'construction',
      completedJobs: ['shipper'], soundEnabled: false, completedTutorials: ['construction'],
      achievements: [{ id: 'first-day', unlockedAt: '2026-10-01T05:00:00.000Z' }],
      jobStats: { ...legacy.jobStats, shipper: { timesPlayed: 18, bestScore: 600, totalScore: 3500, totalMoneyEarned: 900000 } },
    })
    const legacyPage = await legacyContext.newPage()
    await legacyPage.addInitScript((state) => {
      if (!localStorage.getItem('muu-sinh-player-progress')) {
        localStorage.setItem('muu-sinh-player-progress', JSON.stringify({ version: 2, state }))
      }
    }, legacy)
    await legacyPage.goto(origin)
    await legacyPage.getByLabel('Bạn tên gì?', { exact: true }).waitFor()
    assert.deepEqual(withoutProfile((await readSave(legacyPage)).state), legacy)
    await completeProfile(legacyPage, 'Anh Thợ')
    assert.deepEqual(withoutProfile((await readSave(legacyPage)).state), legacy, 'Onboarding reset existing progression')
    await legacyPage.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    assert.deepEqual(await legacyPage.locator('.profile-stats .stat-value').allInnerTexts(), ['18', '12', '8 ngày', '900.000đ'])
    assert.equal(await legacyPage.locator('.level-badge').innerText(), 'CẤP 2')
    await legacyPage.reload()
    await legacyPage.locator('.home-player').waitFor()
    assert.deepEqual(withoutProfile((await readSave(legacyPage)).state), legacy)
    console.log('PASS: real version-2 save migrates without progress loss; populated Profile stats and refresh')
  } finally {
    await legacyContext.close()
  }
}

module.exports = { completeProfile, verifyProfileFlows }
