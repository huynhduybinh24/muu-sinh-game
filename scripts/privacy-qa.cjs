const assert = require('node:assert/strict')
const path = require('node:path')
const { completeProfile, dismissReward } = require('./profile-qa.cjs')

async function verifyPrivacy(page, context, origin, artifacts) {
  const direct = await context.request.get(`${origin}/privacy-policy`)
  assert.equal(direct.status(), 200)
  assert.ok((await direct.text()).includes('<aside>'), 'Direct clean URL must serve HTML policy, not SPA fallback')
  const snapshot = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])))
  async function openDraft() {
    const before = await snapshot()
    await page.locator('.privacy-policy summary').click()
    if (await page.locator('.profile-content').count()) {
      const footer = await page.locator('.screen-footer').boundingBox()
      assert.ok(footer.y + footer.height <= page.viewportSize().height + 1, 'Expanded privacy must not push Profile navigation below viewport')
    }
    const link = page.getByRole('link', { name: 'XEM BẢN NHÁP HTML — CHỜ DUYỆT', exact: true })
    assert.equal(await link.getAttribute('href'), '/privacy-policy')
    assert.ok(await link.evaluate(e => e.getBoundingClientRect().height >= 44))
    const popup = context.waitForEvent('page')
    await link.click()
    const policy = await popup
    try {
      await policy.waitForLoadState('domcontentloaded')
      for (const route of ['/privacy-policy', '/privacy-policy.html']) {
        await policy.goto(`${origin}${route}`)
        await policy.reload()
        await policy.getByRole('heading', { name: 'Chính sách quyền riêng tư — MƯU SINH', exact: true }).waitFor()
        assert.equal(await policy.locator('html').getAttribute('lang'), 'vi')
        assert.equal(await policy.locator('section').count(), 6)
        assert.ok((await policy.locator('aside').innerText()).includes('Bản nháp'))
        assert.equal(await policy.locator('script').count(), 0)
        for (const width of [390, 1100]) {
          await policy.setViewportSize({ width, height: 844 })
          assert.equal(await policy.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
        }
      }
      await policy.screenshot({ path: path.join(artifacts, 'privacy-draft.png'), fullPage: true })
    } finally { await policy.close() }
    assert.deepEqual(await snapshot(), before, 'Policy viewing must not change saves/preferences')
  }
  await context.setOffline(true)
  await openDraft() // Welcome, no profile.
  await completeProfile(page, 'Thợ kiểm tra privacy')
  await dismissReward(page)
  await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
  await openDraft() // Existing profile, same storage.
  console.log('PASS: offline HTML policy/clean URL refresh, Welcome/Profile links, mobile/desktop layout and unchanged localStorage. Browser QA only, not physical Android.')
}
module.exports = { verifyPrivacy }
