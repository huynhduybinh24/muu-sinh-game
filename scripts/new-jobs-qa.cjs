const assert = require('node:assert/strict')
const tools = { pump: 'BƠM LỐP', cable: 'KÍCH BÌNH', wrench: 'SIẾT XÍCH', plug: 'VỆ SINH BUGI' }
async function tap(page, x, y) {
  const touch = await page.context().newCDPSession(page)
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await touch.detach()
}
async function verifyNewJobActions(page, run, start, capture) {
  for (const job of ['rubber', 'mechanic', 'coffee', 'fishing']) {
    await page.clock.resume()
    await start(job)
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
    let state = await run('snapshot')
    assert.equal(state.sceneKey, { rubber: 'RubberScene', mechanic: 'MechanicScene', coffee: 'CoffeeScene', fishing: 'FishingScene' }[job])
    if (job === 'rubber') {
      const guide = state.rubberGuide
      await page.mouse.move(guide[0].x, guide[0].y)
      await page.mouse.down()
      for (const point of guide.slice(1)) { await page.mouse.move(point.x, point.y); await page.clock.runFor(35) }
      await page.mouse.up()
      state = await run('snapshot')
      assert.equal(state.served, '✓ 1')
      assert.ok(Number(state.score.replace(/\D/g, '')) >= 120)
      await capture('rubber-mouse-perfect')
      await page.clock.runFor(650)
      const touch = await page.context().newCDPSession(page)
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...guide[0], id: 1 }] })
      for (const point of guide.slice(1)) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, id: 1 }] })
        await page.clock.runFor(35)
      }
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await touch.detach()
      assert.equal((await run('snapshot')).served, '✓ 2')
      await capture('rubber-touch-perfect')
      await page.clock.runFor(650)
      const before = Number((await run('snapshot')).score.replace(/\D/g, ''))
      await page.mouse.move(90, 250); await page.mouse.down(); await page.mouse.move(90, 390); await page.mouse.up()
      assert.equal(Number((await run('snapshot')).score.replace(/\D/g, '')), Math.max(0, before - 30))
    } else if (job === 'mechanic') {
      const position = (tool) => { const index = Object.keys(tools).indexOf(tool); return [index % 2 ? 269 : 91, 532 + Math.floor(index / 2) * 61] }
      await page.mouse.click(...position(state.mechanicProblem.tool))
      await page.clock.runFor(100)
      assert.equal((await run('snapshot')).state, 'work')
      // A rapid second choice cannot duplicate a repair.
      await run('pressButton', [tools[state.mechanicProblem.tool]])
      await page.clock.runFor(350)
      assert.equal((await run('snapshot')).served, '✓ 1')
      await capture('mechanic-correct')
      await page.clock.runFor(650)
      state = await run('snapshot')
      const wrong = Object.keys(tools).find((tool) => tool !== state.mechanicProblem.tool)
      const before = Number(state.score.replace(/\D/g, ''))
      await tap(page, ...position(wrong))
      await page.clock.runFor(400)
      assert.equal(Number((await run('snapshot')).score.replace(/\D/g, '')), Math.max(0, before - 40))
      await capture('mechanic-wrong')
    } else if (job === 'coffee') {
      if (state.coffeeRecipe.condensed) await run('pressButton', ['THÊM SỮA'])
      if (state.coffeeRecipe.fresh) await run('pressButton', ['THÊM SỮA TƯƠI'])
      await run('pressButton', ['THÊM ĐÁ'])
      await page.mouse.click(76, 617)
      await page.clock.runFor(2000)
      await tap(page, 191, 617)
      await page.mouse.click(294, 617)
      assert.equal((await run('snapshot')).served, '✓ 1')
      assert.ok(Number((await run('snapshot')).score.replace(/\D/g, '')) >= 120)
      await capture('coffee-perfect')
      await page.clock.runFor(650)
      const before = Number((await run('snapshot')).score.replace(/\D/g, ''))
      await run('pressButton', ['BẮT ĐẦU PHA']); await page.clock.runFor(100); await run('pressButton', ['DỪNG']); await run('pressButton', ['GIAO KHÁCH'])
      assert.equal(Number((await run('snapshot')).score.replace(/\D/g, '')), Math.max(0, before - 50))
      await capture('coffee-weak-wrong')
    } else {
      const bite = async () => {
        await page.mouse.click(180, 590)
        for (let i = 0; i < 30 && !(await run('snapshot')).fishingStatus?.startsWith('CÁ CẮN'); i++) await page.clock.runFor(100)
        assert.ok((await run('snapshot')).fishingStatus.startsWith('CÁ CẮN'))
      }
      await bite(); await tap(page, 180, 590); await page.clock.runFor(475); await page.mouse.click(180, 590)
      assert.equal((await run('snapshot')).served, '✓ 1')
      assert.ok(Number((await run('snapshot')).score.replace(/\D/g, '')) >= 90)
      await capture('fishing-catch')
      await page.clock.runFor(650); await bite(); await page.clock.runFor(1500)
      assert.equal((await run('snapshot')).served, '✓ 1', 'Missed bite must not award a fish')
      await capture('fishing-missed-bite')
    }
    await page.clock.runFor(46_000)
    const result = await run('getCompletion')
    assert.equal(result.jobId, job)
    assert.ok(result.score >= 0)
    const key = { rubber: 'treesTapped', mechanic: 'vehiclesRepaired', coffee: 'customersServed', fishing: 'fishCaught' }[job]
    assert.equal(result.metadata[key], job === 'rubber' ? 2 : 1)
    if (job === 'rubber') assert.equal(result.metadata.perfectTaps, 2)
    if (job === 'coffee') assert.equal(result.metadata.perfectBrews, 1)
    if (job === 'mechanic') assert.equal(result.metadata.correctRepairs, 1)
    await page.clock.resume(); await start(job); await run('checkShutdown')
    console.log(`PASS: ${job} real controls/scoring, avatar, 45s result metadata and replay/cleanup`)
  }
}
module.exports = { verifyNewJobActions }
