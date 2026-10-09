const assert = require('node:assert/strict')
const professions = ['it', 'accountant', 'police', 'doctor', 'teacher', 'taxi']
const score = s => Number(s.score.replace(/\D/g, ''))
const directions = { up: [180, 521], down: [180, 582], left: [64, 582], right: [296, 582] }
function nextNode(node, direction) {
  if (direction === 'up') return node >= 3 ? node - 3 : null
  if (direction === 'down') return node < 6 ? node + 3 : null
  if (direction === 'left') return node % 3 > 0 ? node - 1 : null
  return node % 3 < 2 ? node + 1 : null
}
function route(from, target, forbidden) {
  const queue = [[from, []]], visited = new Set([from])
  while (queue.length) {
    const [node, steps] = queue.shift()
    if (node === target) return steps
    for (const direction of Object.keys(directions)) {
      const next = nextNode(node, direction)
      if (next !== null && !visited.has(next) && !forbidden.includes(next)) { visited.add(next); queue.push([next, [...steps, direction]]) }
    }
  }
  return []
}
async function verifyProfessionActions(page, run, start, capture) {
  const touch = await page.context().newCDPSession(page)
  let native = false
  const tap = async (x, y) => {
    if (native) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } else await page.mouse.click(x, y)
    await page.clock.runFor(16)
  }
  const state = () => run('expansionSnapshot')
  const button = async label => {
    const target = (await state()).texts.find(t => t.visible && t.text === label)
    assert.ok(target, `Visible button ${label}`); await tap(target.x, target.y)
  }
  const drive = async (target, collision = false) => {
    for (let i = 0; i < 45; i++) {
      const s = await state()
      if (s.node === target && !collision) return
      const path = route(s.node, target, collision ? [s.destination] : [s.obstacle, ...(s.green ? [] : [4])])
      if (!path.length) { await page.clock.runFor(150); continue }
      const direction = path[0], next = nextNode(s.node, direction)
      if (collision && next === s.obstacle) { await tap(...directions[direction]); return }
      if (next === 4 && !s.green) { await page.clock.runFor(150); continue }
      await tap(...directions[direction]); await page.clock.runFor(380)
    }
    throw new Error('Taxi route did not finish')
  }
  try {
    for (const job of professions) {
      await page.clock.resume(); await start(job); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
      let s = await state()
      assert.equal(s.timer, '⏱ 45s')
      // Exercise one actual wrong action on a fresh game before any score is earned.
      if (job === 'it') await tap(202, 249 + ((s.ticket.broken + 1) % 3) * 48)
      if (job === 'accountant') {
        const total = s.invoice.items.reduce((n, item) => n + item.quantity * item.price, 0)
        await button(s.invoice.claimed === total ? 'HÓA ĐƠN SAI' : 'HÓA ĐƠN ĐÚNG')
      }
      if (job === 'police') await button(s.request.violation ? (s.request.lane === 'vertical' ? 'ĐÈN DỌC' : 'ĐÈN NGANG') : 'DỪNG XE VƯỢT ĐỎ')
      if (job === 'doctor') {
        const correct = s.requests[0].urgency > s.requests[1].urgency ? 0 : 1
        await tap(130 + (1 - correct) * 138, 294)
      }
      if (job === 'teacher') await tap(296, 574)
      if (job === 'taxi') { await button('NHẬN CUỐC'); s = await state(); await drive(s.obstacle, true) }
      assert.equal(score(await state()), 0, `${job}: score floors at zero`)
      // Start a clean round for positive/perfect metadata, without manipulating scene state.
      await page.clock.resume(); await start(job); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
      for (native of [false, true]) {
        s = await state()
        if (job === 'it') {
          await tap(202, 249 + s.ticket.broken * 48); await tap(180, 514 + s.ticket.fix * 53)
          for (let i = 0; i < 3; i++) await tap(180, 514 + i * 53)
        } else if (job === 'accountant') {
          const total = s.invoice.items.reduce((n, item) => n + item.quantity * item.price, 0)
          await button(s.invoice.claimed === total ? 'HÓA ĐƠN ĐÚNG' : 'HÓA ĐƠN SAI')
          await tap(64 + s.options.indexOf(total) * 116, 580)
        } else if (job === 'police') {
          if (s.request.violation) await button('DỪNG XE VƯỢT ĐỎ')
          await button('ĐỎ CẢ HAI'); await button(s.request.lane === 'vertical' ? 'ĐÈN DỌC' : 'ĐÈN NGANG')
        } else if (job === 'doctor') {
          const chosen = s.requests[0].urgency > s.requests[1].urgency ? 0 : 1
          await tap(130 + chosen * 138, 294); await tap(64 + s.requests[chosen].tool * 116, 563)
          for (const shape of s.requests[chosen].sequence) await tap(64 + shape * 116, 563)
        } else if (job === 'teacher') {
          for (let i = 0; i < 3; i++) await tap(64 + i * 116, 574)
          await tap(64 + s.request * 116, 574); await button('CẢ LỚP CHÚ Ý NÀO!'); await tap(64 + s.question.correct * 116, 574)
        } else {
          await button('NHẬN CUỐC'); s = await state(); await drive(s.pickup)
          s = await state(); assert.equal(s.stage, 'destination', 'Taxi actually picked up passenger')
          await drive(s.destination)
        }
        s = await state(); assert.ok(score(s) > 0); assert.ok(s.reactions.includes('success'), `${job}: avatar success`)
        await capture(`profession-${job}-${native ? 'touch' : 'mouse'}`); await page.clock.runFor(850)
      }
      const earned = await state()
      assert.ok(Object.values(earned.metadata).some(n => n >= 2), `${job}: both real interactions complete`)
      if (job !== 'police') assert.ok(Object.values(earned.metadata).filter(n => n > 0).length === 2, `${job}: perfect/correct metric`)
      await run('nativePause', [true]); await page.clock.runFor(100)
      const frozen = await page.locator('#avatar-scene-qa canvas').screenshot()
      await page.clock.runFor(2000)
      assert.ok((await page.locator('#avatar-scene-qa canvas').screenshot()).equals(frozen), `${job}: native pause freezes rendering`)
      await run('nativePause', [false]); native = false
      await page.clock.runFor(47_000)
      const result = await run('getCompletion')
      assert.equal(result.jobId, job); assert.ok(result.score >= 0); assert.deepEqual(result.metadata, earned.metadata)
      for (const size of [{width:360,height:800},{width:390,height:844},{width:412,height:915}]) {
        await page.setViewportSize(size); await page.clock.resume(); await start(job); await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
        assert.equal(await page.locator('#avatar-scene-qa canvas').count(), 1); await capture(`profession-${job}-${size.width}`); await run('checkShutdown')
      }
      await page.setViewportSize({width:390,height:844})
      await page.clock.resume(); await run('startEquipped', [job]); assert.equal((await run('snapshot')).appearance.shirtId, 'rose'); await run('checkShutdown')
      await page.emulateMedia({reducedMotion:'reduce'}); await start(job); await run('exerciseVisualFx')
      assert.equal((await run('snapshot')).motionTweens, 0); assert.equal((await run('snapshot')).activeParticles, 0)
      await run('checkShutdown'); await page.emulateMedia({reducedMotion:'no-preference'})
      console.log(`PASS: ${job} mouse/touch, wrong/floor, success/perfect metadata, pause, 45s GameResult, 3 sizes, paid outfit/reduced motion and replay cleanup`)
    }
  } finally { await touch.detach() }
}
module.exports = { verifyProfessionActions }
