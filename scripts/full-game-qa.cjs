// Production offline E2E with real wall time. Observation only: never seeds RNG,
// changes score/timers or emits Phaser game callbacks to simulate user controls.
const assert=require('node:assert/strict')
const fs=require('node:fs/promises')
const path=require('node:path')
const {chromium}=require(process.env.PWA_QA_PLAYWRIGHT||'playwright')
const {completeProfile,dismissReward}=require('./profile-qa.cjs')
const {verifyProductionAssets}=require('./static-qa.cjs')
const {interact,sleep}=require('./gameplay-input-qa.cjs')
const jobs=['sugarcane','construction','shipper','noodle','barber','carwash','rubber','mechanic','coffee','fishing','banhmi','gas','cargo','cleaning','electrician','florist','security','photographer','cashier','harvest','it','accountant','police','doctor','teacher','taxi']
const names=['Bán nước mía','Phụ hồ','Shipper','Bán hủ tiếu','Cắt tóc','Rửa xe','Cạo cao su','Sửa xe','Pha cà phê','Đánh cá','Bán bánh mì','Đổ xăng','Bốc hàng','Quét đường','Thợ điện','Bán hoa','Bảo vệ','Chụp ảnh','Thu ngân','Thu hoạch trái cây','Lập trình viên','Kế toán','Công an','Bác sĩ','Giáo viên','Tài xế']
const sizes=[{width:360,height:800},{width:390,height:844},{width:412,height:915}]
function observe() {
  const qa={games:[],completions:[],countdowns:[]};window.__fullGameQA=qa
  new MutationObserver(()=>{
    const value=document.querySelector('.countdown-overlay strong')?.textContent
    if(value&&value!==qa.countdowns.at(-1)?.value)qa.countdowns.push({value,at:performance.now()})
  }).observe(document,{childList:true,subtree:true,characterData:true})
  let phaser
  Object.defineProperty(window,'Phaser',{configurable:true,get:()=>phaser,set:value=>{
    phaser=value
    const Original=value.Game
    value.Game=new Proxy(Original,{construct(target,args){
      const scene=args[0].scene[0], complete=scene.onComplete
      const entry={createdAt:performance.now(),finishAt:null,ref:null}
      scene.onComplete=function(result){entry.finishAt=performance.now();qa.completions.push({result:structuredClone(result),elapsedMs:entry.finishAt-entry.createdAt});return complete.call(this,result)}
      const game=Reflect.construct(target,args);entry.ref=new WeakRef(game);qa.games.push(entry);return game
    }})
  }})
  qa.snapshot=()=>{
    const entry=qa.games.findLast(e=>e.ref.deref()?.canvas?.isConnected), game=entry?.ref.deref(), scene=game?.scene?.getScenes(true)[0]
    if(!scene)return null
    const result={key:scene.sys.settings.key,score:scene.score,remaining:scene.remainingGameMs??scene.remainingMs,finished:scene.hasFinished,
      texts:scene.children.list.filter(o=>typeof o.text==='string').map(o=>({text:o.text,x:o.x,y:o.y,visible:o.visible})),
      liveGames:qa.games.filter(e=>e.ref.deref()?.canvas?.isConnected).length}
    for(const name of ['currentOrder','customerTransition','isProcessing','recipe','pattern','roundActive','phase','stage','problem','repairing','order','waiting','requested','target','amount','right','destination','incident','pose','products','choices','options','total','payment','fruitKinds','active','ticket','invoice','request','requests','question','node','pickup','obstacle','deliveries','moving','mood']) {
      const value=scene[name];if(value!==undefined&&typeof value!=='function')result[name]=value
    }
    for(const name of ['box','player','subject'])if(scene[name])result[name]={x:scene[name].x,y:scene[name].y}
    result.green=typeof scene.green==='function'?scene.green():scene.green
    result.brickX=scene.currentBrick?.x;result.targetX=scene.settledBricks?.at(-1)?.shape.x
    return result
  }
}
async function main(){
  await verifyProductionAssets()
  const artifacts=path.resolve('node_modules/.tmp/task-22d')
  await fs.mkdir(artifacts,{recursive:true})
  const report=process.env.FULL_QA_RESUME==='1'?JSON.parse(await fs.readFile(path.join(artifacts,'full-games.json'),'utf8')):
    {startedAt:new Date().toISOString(),mode:'REAL_ELAPSED_PRODUCTION_OFFLINE',workers:3,rows:[]}
  if(process.env.FULL_QA_RESUME==='1'){report.reruns??=[];report.reruns.push(new Date().toISOString())}
  let pendingWrite=Promise.resolve()
  const persist=()=>{const json=JSON.stringify(report,null,2);pendingWrite=pendingWrite.then(()=>fs.writeFile(path.join(artifacts,'full-games.json'),json));return pendingWrite}
  const {preview}=await import('vite'),server=await preview({preview:{host:'127.0.0.1',port:0,strictPort:true}})
  const origin=`http://127.0.0.1:${server.httpServer.address().port}`
  const browser=await chromium.launch({executablePath:process.env.PWA_QA_BROWSER,headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']})
  let cursor=0
  const requested=process.env.FULL_QA_JOBS?process.env.FULL_QA_JOBS.split(','):jobs
  assert.ok(requested.every(id=>jobs.includes(id)),'Unknown QA profession')
  const selected=process.env.FULL_QA_RESUME==='1'?requested.filter(id=>!report.rows.some(row=>row.id===id&&row.status==='PASS')):requested
  async function worker(){
    while(cursor<selected.length){
      const id=selected[cursor++],index=jobs.indexOf(id),name=names[index]
      const previous=report.rows.find(row=>row.id===id)
      if(previous){report.previousAttempts??=[];report.previousAttempts.push(structuredClone(previous));report.rows=report.rows.filter(row=>row.id!==id)}
      const row={id,name,status:'RUNNING',input:index%2?'touch':'mouse',viewport:sizes[index%3],rounds:[]};report.rows.push(row);await persist()
      const context=await browser.newContext({viewport:row.viewport,hasTouch:true,isMobile:true,acceptDownloads:true,timezoneId:'Asia/Ho_Chi_Minh'})
      let controls
      try{
        await context.addInitScript(observe)
        const page=await context.newPage(),errors=[]
        page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
        const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable')
        await page.goto(origin);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await completeProfile(page,`Thợ kiểm thử ${index+1}`)
        const mute=page.getByRole('button',{name:'Tắt âm thanh',exact:true});if(await mute.count())await mute.click()
        await context.setOffline(true);await page.reload();await page.locator('.home-player').waitFor();await dismissReward(page)
        const save=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('muu-sinh-player-progress')).state)
        const snapshot=()=>page.evaluate(()=>window.__fullGameQA.snapshot())
        controls=await interact(page,snapshot,row.input==='touch')
        await page.getByRole('button',{name:'SỰ NGHIỆP',exact:true}).click();await page.getByRole('button',{name:`Chơi ${name}`,exact:true}).click()
        await page.getByRole('button',{name:'ĐI LÀM →',exact:true}).click();await page.getByRole('dialog').waitFor();row.tutorial=true
        await page.getByRole('button',{name:'BẮT ĐẦU',exact:true}).click()
        for(let round=0;round<2;round++){
          await page.locator('canvas').waitFor();await page.waitForFunction(()=>window.__fullGameQA.snapshot()?.remaining>43000)
          const countdown=await page.evaluate(()=>window.__fullGameQA.countdowns.slice(-4))
          assert.deepEqual(countdown.map(step=>step.value),['3','2','1','LÀM THÔI!']);row.countdown=true
          assert.equal(await page.locator('canvas').count(),1)
          const before=await save();let gained=false,lastScore=0
          const initial=await snapshot();assert.equal(initial.liveGames,1);assert.equal(initial.key,id[0].toUpperCase()+id.slice(1)+'Scene')
          await page.screenshot({path:path.join(artifacts,`${id}-game-${round}.png`)})
          const deadline=Date.now()+90000
          while(Date.now()<deadline){
            const s=await snapshot();if(!s||s.finished)break
            assert.ok(Number.isInteger(s.score)&&s.score>=0)
            if(id==='taxi'&&round===0){row.trace??=[];row.trace.push({remaining:s.remaining,score:s.score,stage:s.stage,node:s.node,pickup:s.pickup,destination:s.destination,green:s.green,obstacle:s.obstacle,moving:s.moving,mood:s.mood})}
            if(s.score>lastScore)gained=true;lastScore=s.score
            if(round===0&&s.remaining>3500){await controls.success(id)}
            await sleep(round===0?60:450)
          }
          await page.locator('.share-card-preview').waitFor({timeout:90000})
          const completion=await page.evaluate(()=>window.__fullGameQA.completions.at(-1))
          assert.ok(completion.elapsedMs>=45000,`Timer finished too early: ${completion.elapsedMs}ms`)
          const result=completion.result;assert.equal(result.jobId,id);assert.ok(result.score>=0)
          assert.equal(result.earnedMoney,12000+result.score*1250)
          assert.equal(result.reputationChange,result.score>=40?3:result.score>=20?2:result.score>=5?1:-1)
          const after=await save(),earnedXp=30+Math.min(120,Math.floor(result.score/20))
          assert.equal(after.money-before.money,result.earnedMoney);assert.equal(after.xp-before.xp,earnedXp)
          assert.equal(after.totalGamesPlayed,before.totalGamesPlayed+1);assert.equal(after.jobStats[id].timesPlayed,before.jobStats[id].timesPlayed+1)
          assert.equal(after.jobStats[id].totalMoneyEarned-before.jobStats[id].totalMoneyEarned,result.earnedMoney)
          assert.equal((await page.locator('.share-card-preview h1').innerText()).toLocaleUpperCase('vi'),name.toLocaleUpperCase('vi'))
          await page.waitForFunction(()=>window.__fullGameQA.games.every(e=>!e.ref.deref()?.canvas?.isConnected))
          assert.equal(await page.locator('canvas').count(),0)
          const metrics=(await cdp.send('Performance.getMetrics')).metrics
          row.rounds.push({round:round?'replay':'first',...result,earnedXp,elapsedMs:completion.elapsedMs,successfulInput:round?null:gained,
            jsHeapBytes:metrics.find(m=>m.name==='JSHeapUsedSize')?.value,domNodes:metrics.find(m=>m.name==='Nodes')?.value})
          if(round===0){
            assert.ok(gained,`${id}: no successful pointer interaction produced score`)
            await page.screenshot({path:path.join(artifacts,`${id}-result.png`)})
            const dl=page.waitForEvent('download');await page.getByRole('button',{name:'LƯU ẢNH',exact:true}).click();await(await dl).saveAs(path.join(artifacts,`${id}-result-card.png`))
            const png=await fs.readFile(path.join(artifacts,`${id}-result-card.png`))
            assert.equal(png.readUInt32BE(16),1080);assert.equal(png.readUInt32BE(20),1350)
            await page.getByRole('button',{name:'CHƠI LẠI',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0)
          }
          await persist()
        }
        assert.equal(await page.evaluate(()=>window.__fullGameQA.completions.length),2)
        await page.getByRole('button',{name:'VỀ TRANG CHỦ →',exact:true}).click();await page.locator('.home-player').waitFor();await dismissReward(page)
        const saved=await save();await page.reload();await page.locator('.home-player').waitFor();await dismissReward(page);assert.deepEqual(await save(),saved)
        assert.deepEqual(errors,[]);row.status='PASS';row.errors=errors;row.cleanup=true;row.offlineReload=true;row.backToHome=true
        console.log(`PASS ${id}: real ${row.rounds.map(r=>(r.elapsedMs/1000).toFixed(2)+'s').join('/')} first/replay; ${row.input} success; score ${row.rounds[0].score}; money/XP, PNG, cleanup, offline persistence`)
      }catch(error){row.status='FAIL';row.error=String(error.stack||error);console.error(`FAIL ${id}: ${error.message}`)}
      finally{await controls?.dispose().catch(()=>{});await context.close();await persist()}
    }
  }
  try{await Promise.all(Array.from({length:Math.min(3,selected.length)},worker));report.finishedAt=new Date().toISOString();await persist();assert.ok(requested.every(id=>report.rows.some(r=>r.id===id&&r.status==='PASS')),'Some requested professions failed');console.log(`PASS: ${report.rows.filter(r=>r.status==='PASS').length}/${report.rows.length} full production real-time jobs. Evidence: ${artifacts}`)}
  finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1})
