// Reuses the same local browser prerequisites as qa:pwa; no app globals/test hooks.
const { chromium } = require(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { verifyNewJobActions } = require('./new-jobs-qa.cjs')
const { verifyNativeGestures } = require('./native-gestures-qa.cjs')

async function main() {
  const { createServer } = await import('vite')
  const server = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: true, open: false } })
  await server.listen()
  const artifacts = await fs.mkdtemp(path.join(os.tmpdir(), 'muu-sinh-avatar-qa-'))
  console.log(`Avatar QA artifacts: ${artifacts}`)
  let browser
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.PWA_QA_BROWSER ? { executablePath: process.env.PWA_QA_BROWSER } : {}) })
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`)
    const run = (method, args = []) => page.evaluate(async ({ method, args }) => {
      const qa = await import('/tests/avatar-qa-browser.ts')
      return qa[method](...args)
    }, { method, args })
    const profile = { playerName: 'Nguyễn Ánh', createdAt: '2026-10-07T05:00:00Z', appearance: {
      gender: 'female', skinToneId: 'deep', hairId: 'bun', shirtId: 'mint', pantsId: 'sand',
    } }
    const start = async (job, identity = profile) => {
      await run('start', [job, identity])
      const state = await run('snapshot')
      assert.equal(state.avatarCount, 1)
      assert.ok(state.motionTweens <= 1)
      if (identity) assert.deepEqual(state.appearance, identity.appearance)
      assert.equal(state.visualParticles, 24, 'Visual particle pool must stay bounded')
    }
    const capture = async (name) => {
      // Input changes state immediately; allow one frame to render the canvas.
      await page.clock.runFor(16)
      await page.screenshot({ path: path.join(artifacts, `${name}.png`) })
    }

    await page.clock.install()
    await verifyNativeGestures(page, run, start)
    await page.clock.resume()
    await start('sugarcane')
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
    let state = await run('snapshot')
    const iceTaps = { none: 0, little: 1, normal: 2 }[state.order.iceLevel]
    for (let index = 0; index < iceTaps; index++) await run('pressButton', ['THÊM ĐÁ'])
    if (state.order.kumquat) await run('pressButton', ['THÊM TẮC'])
    await run('pressButton', ['ÉP MÍA'])
    await page.clock.runFor(50)
    assert.equal((await run('snapshot')).state, 'work')
    await capture('sugarcane-work')
    await page.clock.runFor(state.pressDuration + 50)
    await run('pressButton', ['GIAO KHÁCH'])
    state = await run('snapshot')
    assert.equal(state.state, 'success')
    assert.ok(Number(state.score.replace(/\D/g, '')) >= 100)
    await capture('sugarcane-success')
    await page.clock.runFor(600)
    state = await run('snapshot')
    if (state.order.iceLevel === 'none') await run('pressButton', ['THÊM ĐÁ'])
    await run('pressButton', ['ÉP MÍA'])
    await page.clock.runFor(state.pressDuration + 50)
    await run('pressButton', ['GIAO KHÁCH'])
    state = await run('snapshot')
    assert.equal(state.state, 'fail')
    assert.ok(state.reactions.includes('work') && state.reactions.includes('success') && state.reactions.includes('fail'))
    await capture('sugarcane-fail')
    await page.clock.runFor(16_000)
    assert.ok((await run('snapshot')).reactions.filter((value) => value === 'fail').length >= 2, 'Customer timeout did not react')
    await run('checkShutdown')
    console.log('PASS: Sugarcane custom appearance, work/correct/wrong/timeout reactions, unchanged scoring, shutdown cleanup')

    await page.clock.resume()
    await start('construction')
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
    state = await run('snapshot')
    await page.clock.runFor(Math.max(0, (180 - state.brickX) / 90 * 1000))
    await run('dropBrick')
    await page.clock.runFor(40)
    assert.equal((await run('snapshot')).state, 'work')
    await page.clock.runFor(290)
    state = await run('snapshot')
    assert.equal(state.state, 'success')
    assert.equal(state.score, '⭐ 100')
    await capture('construction-perfect')
    for (let frame = 0; frame < 30 && (await run('snapshot')).brickX === null; frame++) {
      await page.clock.runFor(16)
    }
    await run('dropBrick')
    await page.clock.runFor(480)
    state = await run('snapshot')
    assert.equal(state.state, 'fail')
    assert.equal(state.score, '⭐ 70')
    assert.equal(state.avatarCount, 1)
    await capture('construction-miss')
    await run('checkShutdown')
    console.log('PASS: Construction custom appearance, PERFECT/MISS reactions, +100/-30 scoring, stable tower/input, cleanup')

    await page.clock.resume()
    await start('shipper')
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
    await run('pressButton', ['←'])
    await page.clock.runFor(690)
    await run('releaseControls')
    state = await run('snapshot')
    assert.equal(state.state, 'move')
    assert.ok(state.anchor.x < 65)
    assert.equal(state.anchor.scaleX, 1)
    await run('pressButton', ['↑'])
    await page.clock.runFor(1750)
    await run('releaseControls')
    assert.equal((await run('snapshot')).objective, 'GIAO ĐẾN KHÁCH HÀNG')
    await run('pressButton', ['↓'])
    await page.clock.runFor(1600)
    await run('releaseControls')
    await run('pressButton', ['→'])
    await page.clock.runFor(1180)
    await run('releaseControls')
    state = await run('snapshot')
    assert.equal(state.deliveries, '📦 1')
    assert.equal(state.state, 'success')
    const deliveryScore = Number(state.score.replace(/\D/g, ''))
    await capture('shipper-delivery')
    await run('pressButton', ['↑'])
    await page.clock.runFor(350)
    await run('releaseControls')
    state = await run('snapshot')
    assert.equal(state.state, 'fail')
    assert.equal(Number(state.score.replace(/\D/g, '')), deliveryScore - 20)
    const collisionPosition = state.anchor
    await page.clock.runFor(500)
    assert.deepEqual((await run('snapshot')).anchor, collisionPosition, 'Reaction moved collision anchor')
    await capture('shipper-collision')
    await run('checkShutdown')
    console.log('PASS: Shipper custom rider/scooter, movement, pickup/delivery, collision penalty, stable unanimated hitbox, cleanup')

    await page.clock.resume()
    profile.appearance.shirtId = 'blue'
    await start('shipper')
    assert.equal((await run('snapshot')).appearance.shirtId, 'blue')
    await run('checkShutdown')
    for (const job of ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash', 'rubber', 'mechanic', 'coffee', 'fishing']) {
      await start(job, null)
      assert.equal((await run('snapshot')).appearance.shirtId, 'coral')
      await run('checkShutdown')
    }
    for (const job of ['noodle', 'barber', 'carwash']) {
      await start(job)
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
      state = await run('snapshot')
      assert.equal(state.sceneKey, { noodle: 'NoodleScene', barber: 'BarberScene', carwash: 'CarwashScene' }[job])
      if (job === 'noodle') {
        await run('pressButton', ['GIAO KHÁCH'])
        assert.equal((await run('snapshot')).score, '⭐ 0', 'Wrong bowl must not make score negative')
        await page.clock.runFor(650)
        state = await run('snapshot')
        const labels = { noodles: 'THÊM HỦ TIẾU', broth: 'THÊM NƯỚC', meat: 'THÊM THỊT', vegetables: 'THÊM RAU' }
        for (const ingredient of state.noodleRecipe.ingredients) await run('pressButton', [labels[ingredient]])
        assert.equal((await run('snapshot')).state, 'work')
        await run('pressButton', ['GIAO KHÁCH'])
        state = await run('snapshot')
        assert.equal(state.state, 'success')
        assert.ok(Number(state.score.replace(/\D/g, '')) >= 100)
        await capture('noodle-success')
        await page.clock.runFor(650)
        await run('pressButton', ['THÊM HỦ TIẾU'])
        await run('pressButton', ['LÀM LẠI'])
        const beforeWrong = Number((await run('snapshot')).score.replace(/\D/g, ''))
        await run('pressButton', ['GIAO KHÁCH'])
        assert.equal((await run('snapshot')).state, 'fail')
        assert.equal(Number((await run('snapshot')).score.replace(/\D/g, '')), beforeWrong - 50)
        await page.clock.runFor(14_000)
        assert.ok((await run('snapshot')).reactions.filter((reaction) => reaction === 'fail').length >= 2)
      } else if (job === 'barber') {
        for (let customer = 0; customer < 2; customer++) {
          state = await run('snapshot')
          for (let section = 0; section < state.barberTarget.keep.length; section++) {
            if (!state.barberTarget.keep[section]) await run('cutHair', [section])
          }
          assert.equal((await run('snapshot')).state, 'work')
          await run('pressButton', ['XONG'])
          assert.equal((await run('snapshot')).state, 'success')
          await capture(`barber-perfect-${customer}`)
          await page.clock.runFor(650)
        }
        assert.equal((await run('snapshot')).served, '✓ 2')
        // Cut exactly the sections the target says to keep: every section is wrong.
        state = await run('snapshot')
        for (let section = 0; section < 6; section++) {
          if (state.barberTarget.keep[section]) await run('cutHair', [section])
        }
        await run('pressButton', ['XONG'])
        assert.equal((await run('snapshot')).state, 'fail')
      } else {
        await page.mouse.move(104, 281)
        await page.mouse.down()
        await page.clock.runFor(100)
        assert.equal((await run('snapshot')).state, 'work')
        const rows = [[104, 152, 200, 248], [86, 134, 182, 230, 278], [112, 174, 236]]
        for (let row = 0; row < rows.length; row++) {
          for (const x of rows[row]) {
            await page.mouse.move(x, [281, 335, 379][row], { steps: 4 })
            await page.clock.runFor(550)
            if ((await run('snapshot')).served === '✓ 1') break
          }
          if ((await run('snapshot')).served === '✓ 1') break
        }
        await page.mouse.up()
        state = await run('snapshot')
        assert.equal(state.served, '✓ 1')
        assert.ok(Number(state.cleanliness.replace(/\D/g, '')) >= 90)
        assert.ok(Number(state.score.replace(/\D/g, '')) >= 100)
        await capture('carwash-completed')
        await page.clock.runFor(650)
        const touch = await page.context().newCDPSession(page)
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 104, y: 281, id: 1 }] })
        await page.clock.runFor(100)
        assert.equal((await run('snapshot')).state, 'work')
        for (let row = 0; row < rows.length; row++) {
          for (const x of rows[row]) {
            await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: [281, 335, 379][row], id: 1 }] })
            await page.clock.runFor(550)
            if ((await run('snapshot')).served === '✓ 2') break
          }
          if ((await run('snapshot')).served === '✓ 2') break
        }
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await touch.detach()
        assert.equal((await run('snapshot')).served, '✓ 2', 'Touch drag did not wash the next vehicle')
        await capture('carwash-touch-completed')
      }
      await page.clock.runFor(46_000)
      const result = await run('getCompletion')
      assert.equal(result.jobId, job)
      assert.ok(result.score >= 0)
      assert.equal(result.metadata[job === 'carwash' ? 'vehiclesWashed' : 'customersServed'], job === 'noodle' ? 1 : 2)
      if (job === 'barber') assert.equal(result.metadata.perfectHaircuts, 2)
      assert.equal(await page.locator('canvas').count(), 1)
      await page.clock.resume()
      await start(job)
      await run('checkShutdown')
      console.log(`PASS: ${job} scene, real actions, scoring/reactions, 45s timer, result metadata, avatar, replay/cleanup`)
    }
    await verifyNewJobActions(page, run, start, capture)
    for (const job of ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash', 'rubber', 'mechanic', 'coffee', 'fishing']) {
      await run('startEquipped', [job])
      const close = page.getByRole('button', { name: 'Đóng quà hôm nay', exact: true })
      if (await close.count()) await close.click()
      const equipped = await run('snapshot')
      assert.equal(equipped.avatarCount, 1)
      assert.deepEqual(equipped.appearance, { gender: 'female', skinToneId: 'deep', hairId: 'long', shirtId: 'rose', pantsId: 'plum' })
      await capture(`equipped-${job}`)
      await run('checkShutdown')
    }
    console.log('PASS: real store purchases/equipment pass the latest paid outfit to all ten Phaser scenes without duplicate avatars')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const job of ['sugarcane', 'construction', 'shipper', 'noodle', 'barber', 'carwash', 'rubber', 'mechanic', 'coffee', 'fishing']) {
      await start(job)
      await run('exerciseVisualFx')
      const reduced = await run('snapshot')
      assert.equal(reduced.motionTweens, 0)
      assert.equal(reduced.visualParticles, 24)
      assert.equal(reduced.activeParticles, 0, 'Reduced motion must suppress visual bursts')
      await run('checkShutdown')
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await start('construction')
    await run('exerciseVisualFx')
    const bounded = await run('snapshot')
    assert.equal(bounded.visualParticles, 24)
    assert.ok(bounded.activeParticles <= 24)
    await run('checkShutdown')
    console.log('PASS: bounded visual pool after repeated bursts, reduced motion in all ten jobs, and particle cleanup')
    await run('dispose')
    assert.deepEqual(errors, [])
    console.log('PASS: replay/new game uses fresh appearance; legacy/missing profile renders defaults in all jobs; no duplicate avatars or browser errors')
  } finally {
    await browser?.close()
    await server.close()
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
