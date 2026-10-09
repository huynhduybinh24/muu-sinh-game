const assert = require('node:assert/strict')
const jobs = ['banhmi', 'gas', 'cargo', 'cleaning', 'electrician', 'florist', 'security', 'photographer', 'cashier', 'harvest']
const labels = { meat: 'THỊT', pate: 'PÂTÉ', vegetables: 'RAU', chili: 'ỚT', egg: 'TRỨNG' }
const flowers = ['rose', 'sunflower', 'lily']
const slots = [{x:128,y:302},{x:211,y:333},{x:292,y:302}]
const score = s => Number(s.score.replace(/\D/g, ''))

async function verifyExpansionActions(page, run, start, capture) {
  const touch = await page.context().newCDPSession(page)
  let native = false
  const move = async (x, y) => native ? touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{x,y,id:1}] }) : page.mouse.move(x,y)
  const down = async (x,y) => native ? touch.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x,y,id:1}]}) : (await page.mouse.move(x,y), page.mouse.down())
  const up = async () => native ? touch.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]}) : page.mouse.up()
  const tap = async (x,y) => { await down(x,y); await up(); await page.clock.runFor(16) }
  const state = () => run('expansionSnapshot')
  const button = async label => {
    const target = (await state()).texts.find(t => t.visible && t.text === label)
    assert.ok(target, `Button ${label} must have a visible label`)
    await tap(target.x,target.y)
  }
  try {
    for (const job of jobs) {
      await page.clock.resume(); await start(job)
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
      let s = await state()
      assert.equal(s.sceneKey, job[0].toUpperCase() + job.slice(1) + 'Scene')
      assert.equal(s.timer, '⏱ 45s')
      // First failure must never push a fresh score below zero.
      if (job === 'banhmi') await button('GIAO KHÁCH')
      if (job === 'gas') { await button(s.requested === 'E5' ? 'RON95' : 'E5'); await down(180,580); await page.clock.runFor(500); await up() }
      if (job === 'cargo') { await down(s.box.x,s.box.y); await move(180,240); await up() }
      if (job === 'cleaning') { await down(180,365); await up() }
      if (job === 'electrician') await button('KIỂM TRA')
      if (job === 'florist') await button('BUỘC HOA')
      if (job === 'security') await tap(96,518)
      if (job === 'photographer') { await down(73,404); await up(); await button('CHỤP') }
      if (job === 'cashier') await tap(64,578)
      if (job === 'harvest') {
        const i = s.fruitKinds.findIndex(k => k !== 'ripe')
        if (i >= 0) await tap(76+i%3*104,240+Math.floor(i/3)*88)
      }
      assert.equal(score(await state()), 0, `${job}: score floor`)
      await page.clock.runFor(800)
      // Verify both mouse and real browser touch (not emitted Phaser callbacks).
      for (const useTouch of [false, true]) {
        native = useTouch; s = await state()
        if (job === 'banhmi') {
          for (const id of s.order.ingredients) await button(labels[id])
          await button('GIAO KHÁCH')
        } else if (job === 'gas') {
          await button(s.requested); await down(180,580)
          const before = (await state()).amount
          await page.clock.runFor((s.target-before)/2.5*1000)
          await up()
        } else if (job === 'cargo') {
          await down(s.box.x,s.box.y); await move(60+['river','market','garden'].indexOf(s.destination)*120,510); await up()
        } else if (job === 'cleaning') {
          await down(75,250)
          for (const [x,y] of [[145,250],[220,250],[285,250],[280,310],[225,310],[135,310],[80,310]]) await move(x,y)
          await up()
        } else if (job === 'electrician') {
          for (let i=0;i<s.right.length;i++) { await tap(68,279+i*56); await tap(292,279+s.right.indexOf(i)*56) }
        } else if (job === 'florist') {
          for (let i=0;i<3;i++) { await down(75+flowers.indexOf(s.order.flowers[i])*105,523); await move(slots[i].x,slots[i].y); await up() }
          await button(s.order.ribbon === 'pink' ? 'NƠ HỒNG' : 'NƠ VÀNG'); await button('BUỘC HOA')
        } else if (job === 'security') {
          for (let i=0;i<20 && !s.incident;i++) { await page.clock.runFor(100); s=await state() }
          assert.ok(s.incident)
          const i=['door','water','crate','bell'].indexOf(s.incident); await tap(96+i%2*168,518+Math.floor(i/2)*57)
        } else if (job === 'photographer') {
          for (let i=0;i<80;i++) {
            const phase=s.phase+.26*Math.min(1.5,.8+(s.metadata.photosTaken||0)*.03)
            if (Math.sin(phase*2.2)>.75) {
              await down(188+Math.sin(phase)*79,316+Math.cos(phase*1.3)*28); await up()
              await page.clock.runFor(260); await button('CHỤP'); break
            }
            await page.clock.runFor(100); s=await state()
          }
        } else if (job === 'cashier') {
          for (let i=0;i<s.products.length;i++) await button('QUÉT MÃ')
          await tap(64+s.choices.indexOf(s.payment-s.total)*116,578)
        } else {
          for (let wave=0;wave<3;wave++) {
            s=await state()
            for (let i=0;i<9;i++) if (s.fruitKinds[i]==='ripe' && s.active[i]) await tap(76+i%3*104,240+Math.floor(i/3)*88)
            await page.clock.runFor(450)
          }
        }
        s=await state()
        assert.ok(score(s)>0, `${job}: ${native?'touch':'mouse'} success`)
        assert.ok(s.reactions.includes('success'), `${job}: avatar success reaction`)
        await capture(`expansion-${job}-${native?'touch':'mouse'}`)
        await page.clock.runFor(800)
      }
      const earned = await state()
      assert.ok(Object.values(earned.metadata).some(n=>n>0), `${job}: meaningful result metadata`)
      const perfectKey={gas:'perfectFills',cargo:'perfectSorts',electrician:'perfectCircuits',florist:'perfectBouquets',photographer:'perfectPhotos',cashier:'correctCheckouts'}[job]
      if (perfectKey) assert.ok(earned.metadata[perfectKey]>=1, `${job}: a real perfect/correct placement must be recorded`)
      if (['gas','cargo','cleaning','florist','photographer'].includes(job)) {
        s=await state(); native=true
        const point = job==='gas' ? {x:180,y:580} : job==='cargo' ? s.box : job==='cleaning' ? {x:50,y:225} : job==='florist' ? {x:75,y:523} : {x:180,y:313}
        if (job==='gas') await button(s.requested)
        await down(point.x,point.y); await page.clock.runFor(50)
        const before=await state(); await run('nativePause',[true]); await page.clock.runFor(1000)
        assert.equal(score(await state()),score(before), `${job}: interruption cannot award or penalize`)
        assert.ok((await state()).pointerId==null && !(await state()).filling, `${job}: gesture canceled`)
        await up(); await run('nativePause',[false])
      }
      native=false
      await page.clock.runFor(47_000)
      const result=await run('getCompletion')
      assert.equal(result.jobId,job); assert.ok(result.score>=0)
      assert.deepEqual(result.metadata,earned.metadata, `${job}: final contract metadata`)
      await page.clock.resume(); await start(job); assert.equal(await page.locator('canvas').count(),1)
      await run('checkShutdown')
      console.log(`PASS: ${job} mouse/touch, failure floor, success/avatar, metadata, 45s completion, replay/cleanup`)
    }
  } finally { await touch.detach() }
}
module.exports={verifyExpansionActions}
