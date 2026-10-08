// Actual Phaser scenes in a desktop browser, not Android device validation.
const assert = require('node:assert/strict')

async function verifyNativeGestures(page, run, start) {
  const touch = await page.context().newCDPSession(page)
  const down = (x, y) => touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] })
  const up = () => touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  try {
    for (const job of ['shipper', 'carwash', 'rubber']) {
      await page.clock.resume(); await start(job)
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
      const point = job === 'shipper' ? { x: 256, y: 594 } : job === 'carwash' ? { x: 104, y: 281 } : (await run('snapshot')).rubberGuide[0]
      await down(point.x, point.y); await page.clock.runFor(100)
      const before = await run('snapshot')
      assert.equal(before.state, job === 'shipper' ? 'move' : 'work')
      await run('nativePause', [true]); await page.clock.runFor(2000)
      const paused = await run('snapshot')
      assert.equal(paused.score, before.score, `${job}: pausing must not score a release`)
      assert.equal(paused.timer, before.timer)
      assert.equal(paused.cleanliness, before.cleanliness)
      assert.equal(paused.served, before.served)
      await run('nativePause', [false]); await page.clock.runFor(500)
      const resumed = await run('snapshot')
      assert.equal(resumed.score, before.score)
      assert.deepEqual(resumed.anchor, before.anchor, `${job}: held D-pad must not stick after resume`)
      assert.equal(resumed.cleanliness, before.cleanliness, `${job}: held scrub must stop`)
      await up()
      if (job === 'rubber') {
        await down(point.x, point.y); await page.clock.runFor(32)
        assert.equal((await run('snapshot')).state, 'work', 'Interrupted trace must accept a fresh drag')
        await run('nativePause', [true]); await up(); await run('nativePause', [false])
      }
      await run('checkShutdown')
    }
    console.log('PASS: browser-scene native gesture interruption: no pause scoring/penalty, timer freeze, D-pad/scrub release, fresh rubber drag and cleanup (not device)')
  } finally { await touch.detach() }
}
module.exports = { verifyNativeGestures }
