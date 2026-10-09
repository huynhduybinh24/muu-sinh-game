// Actual production UI screenshots, not Android-device claims. Isolated QA saves only.
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const { completeProfile, dismissReward } = require('./profile-qa.cjs')
const { icon } = require('./brand-art.cjs')
const { rgbaPng } = require('./png-rgba.cjs')
async function main() {
  const output = path.resolve('release-assets'), screenshots = path.join(output, 'screenshots')
  await fs.mkdir(screenshots, { recursive: true })
  const typescript = require('typescript')
  const policySource = await fs.readFile(path.resolve('src/data/privacy.ts'), 'utf8')
  const policyModule = typescript.transpileModule(policySource, { compilerOptions: { module: typescript.ModuleKind.ESNext } }).outputText
  const { privacyPolicy: policy } = await import(`data:text/javascript;base64,${Buffer.from(policyModule).toString('base64')}`)
  await fs.writeFile(path.join(output, 'privacy-policy-draft.md'), `# Chính sách quyền riêng tư — MƯU SINH\n\n${policy.status}\n\n${policy.developer} · Rà soát ${policy.reviewedAt}\n\n${policy.sections.map(section => `## ${section.title}\n\n${section.text}`).join('\n\n')}\n\nKhông công bố trước khi chủ dự án duyệt và bổ sung email/URL thật.\n`)
  const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
  await fs.writeFile(path.resolve('public/privacy-policy.html'), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex"><meta name="theme-color" content="#FFF5DF">
<meta name="description" content="Bản nháp chính sách quyền riêng tư MƯU SINH, chờ chủ dự án duyệt.">
<title>Chính sách quyền riêng tư — MƯU SINH (bản nháp)</title>
<style>body{margin:0;background:#fff5df;color:#304f4b;font:17px/1.65 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:max(24px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(32px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left))}h1{font-size:1.8rem;line-height:1.3}h2{font-size:1.25rem}a{display:inline-block;min-height:44px;color:inherit;font-weight:700}aside{border:2px solid #b47838;border-radius:12px;padding:16px;background:#fff}section{margin-top:28px}p{overflow-wrap:anywhere}</style></head>
<body><main><a href="/">← VỀ TRÒ CHƠI</a><h1>Chính sách quyền riêng tư — MƯU SINH</h1>
<aside>${escape(policy.status)} Email và URL công khai đang chờ chủ dự án xác nhận. Không dùng bản nháp này để nộp Google Play.</aside>
<p>${escape(policy.developer)} · Rà soát ${escape(policy.reviewedAt)}</p>
${policy.sections.map(section => `<section><h2>${escape(section.title)}</h2><p>${escape(section.text)}</p></section>`).join('\n')}
</main></body></html>\n`)
  if (process.argv.includes('--policy-only')) return
  const { chromium } = require(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
  const { preview } = await import('vite')
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const browser = await chromium.launch({ executablePath: process.env.PWA_QA_BROWSER, headless: true })
  const report = { status: 'DRAFT_PENDING_OWNER_BRAND_APPROVAL', method: 'REAL_PRODUCTION_BROWSER_UI_NO_COMPOSITE_SCREENSHOTS', captures: [] }
  try {
    const art = await browser.newPage()
    // Full square Play icon: no pre-rounded corners, existing original emblem/colors.
    const iconSvg = icon({ maskable: true }); await fs.writeFile(path.join(output, 'app-icon.svg'), iconSvg)
    await art.setViewportSize({ width: 512, height: 512 })
    await art.setContent(`<body style="margin:0"><img width="512" height="512" src="data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}"></body>`)
    await art.locator('img').evaluate(image => image.decode())
    const iconPng = rgbaPng(await art.screenshot({ omitBackground: true }))
    assert.equal(iconPng[25], 6); assert.ok(iconPng.length <= 1024 * 1024)
    await fs.writeFile(path.join(output, 'app-icon.png'), iconPng)
    const backdrop = await fs.readFile('public/branding/town-backdrop.svg', 'utf8')
    const logo = await fs.readFile('public/branding/logo-transparent.svg', 'utf8')
    const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500"><rect width="1024" height="500" fill="#CEF3EF"/><image href="data:image/svg+xml;base64,${Buffer.from(backdrop).toString('base64')}" x="0" y="70" width="1024" height="430"/><rect x="160" y="90" width="704" height="205" rx="32" fill="#FFF5DF"/><image href="data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}" x="208" y="110" width="608" height="165"/></svg>`
    await fs.writeFile(path.join(output, 'feature-graphic.svg'), feature)
    await art.setViewportSize({ width: 1024, height: 500 })
    await art.setContent(`<body style="margin:0"><img width="1024" height="500" src="data:image/svg+xml;base64,${Buffer.from(feature).toString('base64')}"></body>`)
    await art.locator('img').evaluate(image => image.decode())
    await art.screenshot({ path: path.join(output, 'feature-graphic.jpg'), type: 'jpeg', quality: 95 })
    await art.close()
    if (process.argv.includes('--art-only')) return
    const context = await browser.newContext({ viewport: { width: 450, height: 800 }, deviceScaleFactor: 2.4, isMobile: true, hasTouch: true })
    const page = await context.newPage(), errors = [], remoteRequests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (!request.url().startsWith(origin) && /^https?:/.test(request.url())) remoteRequests.push(request.url()) })
    await page.goto(origin)
    await page.getByText('CHÍNH SÁCH QUYỀN RIÊNG TƯ', { exact: true }).click()
    await page.getByRole('heading', { name: 'Chính sách quyền riêng tư — MƯU SINH', exact: true }).waitFor()
    await page.getByText('CHÍNH SÁCH QUYỀN RIÊNG TƯ', { exact: true }).click()
    await completeProfile(page, 'Mưu Sinh')
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
    await context.setOffline(true); await page.reload(); await page.locator('.home-player').waitFor(); await dismissReward(page)
    const capture = async (name, alt) => {
      const bytes = await page.screenshot({ type: 'jpeg', quality: 95, animations: 'disabled' })
      const dimensions = await page.evaluate(async base64 => {
        const image = new Image(); image.src = `data:image/jpeg;base64,${base64}`; await image.decode()
        return { width: image.naturalWidth, height: image.naturalHeight }
      }, bytes.toString('base64'))
      assert.deepEqual(dimensions, { width: 1080, height: 1920 })
      await fs.writeFile(path.join(screenshots, `${name}.jpg`), bytes)
      report.captures.push({ filename: `${name}.jpg`, width: 1080, height: 1920, alt })
    }
    await capture('01-home', 'Nhân vật Mưu Sinh và trang chủ trò chơi')
    await page.getByRole('button', { name: 'KHÁM PHÁ THỊ TRẤN', exact: true }).click(); await page.locator('.town-scroll').waitFor()
    await capture('02-town', 'Thị trấn với các địa điểm nghề nghiệp')
    await page.getByRole('button', { name: 'TRANG CHỦ', exact: true }).click()
    for (const [id, name] of [['construction', 'Phụ hồ'], ['sugarcane', 'Bán nước mía']]) {
      await page.getByRole('button', { name: 'SỰ NGHIỆP', exact: true }).click()
      await page.getByRole('button', { name: `Chơi ${name}`, exact: true }).click()
      await page.getByRole('button', { name: 'ĐI LÀM →', exact: true }).click()
      await page.getByRole('button', { name: 'BẮT ĐẦU', exact: true }).click(); await page.locator('canvas').waitFor()
      await page.waitForTimeout(1600); await capture(`03-job-${id}`, `Ca làm ${name} trong trò chơi`)
      await page.locator('.share-card-preview').waitFor({ timeout: 120000 })
      await page.getByRole('button', { name: 'VỀ TRANG CHỦ →', exact: true }).click(); await dismissReward(page)
    }
    await page.getByRole('button', { name: 'CỬA HÀNG', exact: true }).click()
    await capture('04-shop', 'Cửa hàng trang phục và đồ dùng trong game')
    await page.getByRole('button', { name: 'HỒ SƠ', exact: true }).click()
    const before = await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress'))
    await page.getByText('CHÍNH SÁCH QUYỀN RIÊNG TƯ', { exact: true }).click()
    await page.getByRole('heading', { name: 'Chính sách quyền riêng tư — MƯU SINH', exact: true }).waitFor()
    assert.equal(await page.evaluate(() => localStorage.getItem('muu-sinh-player-progress')), before)
    await page.getByText('CHÍNH SÁCH QUYỀN RIÊNG TƯ', { exact: true }).click()
    await page.getByRole('button', { name: 'GARA', exact: true }).click(); await capture('05-garage', 'Gara của nhân vật mới, chưa sở hữu phương tiện')
    await page.getByRole('button', { name: 'PHÒNG CỦA TÔI', exact: true }).click(); await capture('06-room', 'Phòng riêng của nhân vật mới, chưa đặt đồ nội thất')
    assert.deepEqual(errors, []); assert.deepEqual(remoteRequests, [])
    report.offline = 'PASS'; report.privacyEntry = 'PASS_NO_SAVE_MUTATION'; report.remoteRequests = remoteRequests
    await context.close()
  } finally {
    if (!process.argv.includes('--art-only')) await fs.writeFile(path.join(output, 'capture-provenance.json'), JSON.stringify(report, null, 2))
    await browser.close(); await new Promise(resolve => server.httpServer.close(resolve))
  }
  console.log('PASS: draft store assets, genuine browser UI screenshots, offline policy entry and zero external runtime requests.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
