// Real browser pointer input, read-only scene observations. No score/timer mutation.
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function interact(page, snapshot, touchMode) {
  const touch = await page.context().newCDPSession(page)
  const point = async (x, y) => { const b = await page.locator('canvas').boundingBox(); return { x: b.x + x * b.width / 360, y: b.y + y * b.height / 650 } }
  const down = async (x,y) => { const p = await point(x,y); if (touchMode) await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]}); else { await page.mouse.move(p.x,p.y); await page.mouse.down() } }
  const move = async (x,y) => { const p = await point(x,y); if (touchMode) await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:1}]}); else await page.mouse.move(p.x,p.y) }
  const up = async () => touchMode ? touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}) : page.mouse.up()
  const tap = async (x,y) => { await down(x,y); await up(); await sleep(30) }
  const button = async label => {
    const s = await snapshot(), text = s?.texts.find(t => t.visible && t.y > 460 && (t.text === label || t.text.endsWith(` ${label}`) || t.text.endsWith(`${label} →`)))
    if (!text) throw new Error(`Visible game control missing: ${label}`)
    await tap(text.x,text.y)
  }
  const hold = async (label,ms) => {
    const text = (await snapshot()).texts.find(t => t.text === label && t.visible && t.y > 480)
    if (!text) throw new Error(`D-pad ${label} missing`)
    await down(text.x,text.y); await sleep(ms); await up(); await sleep(40)
  }
  const nextNode = (n,d) => d === 'up' ? (n>=3?n-3:null) : d === 'down' ? (n<6?n+3:null) : d === 'left' ? (n%3?n-1:null) : (n%3<2?n+1:null)
  const drive = async target => {
      const s = await snapshot(); if (!s || s.node===target) return
      const queue=[[s.node,[]]], seen=new Set([s.node]); let route=[]
      while(queue.length) {
        const [node,path]=queue.shift(); if(node===target){route=path;break}
        for(const dir of ['up','down','left','right']) {
          const n=nextNode(node,dir)
          if(n!==null&&!seen.has(n)&&n!==s.obstacle&&(n!==4||s.green)) {seen.add(n);queue.push([n,[...path,dir]])}
        }
      }
      if(!route.length){await sleep(150);return}
      await tap(...{up:[180,521],down:[180,582],left:[64,582],right:[296,582]}[route[0]]); await sleep(380)
  }
  async function success(job) {
    let s = await snapshot(); if(!s || s.finished || s.remaining < 10000) return
    if(job==='sugarcane') {
      if(s.customerTransition||s.isProcessing)return
      const ice={none:0,little:1,normal:2}[s.currentOrder.requiredDrink.iceLevel]
      for(let i=0;i<ice;i++)await button('THÊM ĐÁ')
      if(s.currentOrder.requiredDrink.kumquat)await button('THÊM TẮC')
      await button('ÉP MÍA'); await sleep(950); await button('GIAO KHÁCH'); await sleep(650)
    } else if(job==='construction') {
      if(s.phase==='moving'&&Math.abs(s.brickX-s.targetX)<9){await tap(180,340);await sleep(500)}
      else await sleep(35)
    } else if(job==='shipper') {
      if(s.deliveries>0)return
      await hold('←',700); await hold('↑',1700); await hold('↓',1650); await hold('→',1300)
    } else if(job==='noodle') {
      if(!s.roundActive)return
      const names={noodles:'THÊM HỦ TIẾU',broth:'THÊM NƯỚC',meat:'THÊM THỊT',vegetables:'THÊM RAU'}
      for(const id of s.recipe.ingredients)await button(names[id]); await button('GIAO KHÁCH'); await sleep(650)
    } else if(job==='barber') {
      if(!s.roundActive)return
      for(let i=0;i<6;i++)if(!s.pattern.keep[i])await tap(110+i%3*76,263+Math.floor(i/3)*60)
      await button('XONG'); await sleep(650)
    } else if(job==='carwash') {
      if(!s.roundActive)return
      await down(104,281)
      const rows=[[104,152,200,248],[86,134,182,230,278],[112,174,236]]
      for(let r=0;r<3;r++)for(const x of rows[r]){await move(x,[281,335,379][r]);await sleep(500)}
      await up(); await sleep(650)
    } else if(job==='rubber') {
      if(!s.active)return
      await down(94,262)
      for(let i=1;i<25;i++){const t=i/24;await move(94+168*t,262+116*t+Math.sin(t*Math.PI)*34);await sleep(35)}
      await up(); await sleep(650)
    } else if(job==='mechanic') {
      if(!s.roundActive||s.repairing)return
      const i=['pump','cable','wrench','plug'].indexOf(s.problem.tool)
      await tap(i%2?269:91,532+Math.floor(i/2)*61);await sleep(1000)
    } else if(job==='coffee') {
      if(!s.roundActive)return
      if(s.recipe.condensed)await button('THÊM SỮA')
      if(s.recipe.fresh)await button('THÊM SỮA TƯƠI')
      await button('THÊM ĐÁ');await button('BẮT ĐẦU PHA');await sleep(2000);await button('DỪNG');await button('GIAO KHÁCH');await sleep(650)
    } else if(job==='fishing') {
      if(s.phase==='ready')await tap(180,590)
      else if(s.phase==='bite'){await tap(180,590);await sleep(460);await tap(180,590)}
      await sleep(80)
    } else if(job==='banhmi') {
      if(s.waiting)return
      for(const id of s.order.ingredients)await button({meat:'THỊT',pate:'PÂTÉ',vegetables:'RAU',chili:'ỚT',egg:'TRỨNG'}[id])
      await button('GIAO KHÁCH');await sleep(650)
    } else if(job==='gas') {
      if(s.waiting)return
      await button(s.requested);await down(180,580);await sleep(Math.max(0,(s.target-s.amount)/2.5*1000));await up();await sleep(700)
    } else if(job==='cargo') {
      if(!s.box||s.waiting)return
      await down(s.box.x,s.box.y);await move(60+['river','market','garden'].indexOf(s.destination)*120,510);await up();await sleep(600)
    } else if(job==='cleaning') {
      await down(75,250)
      for(const [x,y] of [[145,250],[220,250],[285,250],[280,310],[225,310],[135,310],[80,310]]){await move(x,y);await sleep(40)}
      await up();await sleep(650)
    } else if(job==='electrician') {
      if(s.waiting)return
      for(let i=0;i<s.right.length;i++){await tap(68,279+i*56);await tap(292,279+s.right.indexOf(i)*56)}
      await sleep(700)
    } else if(job==='florist') {
      if(s.waiting)return
      const slots=[[128,302],[211,333],[292,302]]
      for(let i=0;i<3;i++){await down(75+['rose','sunflower','lily'].indexOf(s.order.flowers[i])*105,523);await move(...slots[i]);await up()}
      await button(s.order.ribbon==='pink'?'NƠ HỒNG':'NƠ VÀNG');await button('BUỘC HOA');await sleep(700)
    } else if(job==='security') {
      if(s.incident){const i=['door','water','crate','bell'].indexOf(s.incident);await tap(96+i%2*168,518+Math.floor(i/2)*57)}
      await sleep(100)
    } else if(job==='photographer') {
      if(s.pose>.78){const p=s.phase+.27;await down(188+Math.sin(p)*79,316+Math.cos(p*1.3)*28);await up();await sleep(280);await button('CHỤP');await sleep(650)}
      else await sleep(80)
    } else if(job==='cashier') {
      if(s.waiting)return
      for(let i=0;i<s.products.length;i++)await button('QUÉT MÃ')
      await tap(64+s.choices.indexOf(s.payment-s.total)*116,578);await sleep(650)
    } else if(job==='harvest') {
      for(let i=0;i<9;i++)if(s.fruitKinds[i]==='ripe'&&s.active[i])await tap(76+i%3*104,240+Math.floor(i/3)*88)
      await sleep(450)
    } else if(job==='it') {
      if(s.stage==='waiting')return
      await tap(202,249+s.ticket.broken*48);await tap(180,514+s.ticket.fix*53)
      for(let i=0;i<3;i++)await tap(180,514+i*53)
      await sleep(850)
    } else if(job==='accountant') {
      if(s.stage==='waiting')return
      const total=s.invoice.items.reduce((n,item)=>n+item.quantity*item.price,0)
      await button(s.invoice.claimed===total?'HÓA ĐƠN ĐÚNG':'HÓA ĐƠN SAI');await tap(64+s.options.indexOf(total)*116,580);await sleep(850)
    } else if(job==='police') {
      if(s.waiting)return
      if(s.request.violation)await button('DỪNG XE VƯỢT ĐỎ')
      await button('ĐỎ CẢ HAI');await button(s.request.lane==='vertical'?'ĐÈN DỌC':'ĐÈN NGANG');await sleep(850)
    } else if(job==='doctor') {
      if(s.stage==='waiting')return
      const chosen=s.requests[0].urgency>s.requests[1].urgency?0:1
      await tap(130+chosen*138,294);await tap(64+s.requests[chosen].tool*116,563)
      for(const shape of s.requests[chosen].sequence)await tap(64+shape*116,563)
      await sleep(850)
    } else if(job==='teacher') {
      if(s.stage==='waiting')return
      for(let i=0;i<3;i++)await tap(64+i*116,574)
      await tap(64+s.request*116,574);await button('CẢ LỚP CHÚ Ý NÀO!');await tap(64+s.question.correct*116,574);await sleep(850)
    } else if(job==='taxi') {
      if(s.stage==='waiting'||s.stage==='transition')return
      if(s.stage==='offered')await button('NHẬN CUỐC')
      else await drive(s.stage==='pickup'?s.pickup:s.destination)
    }
  }
  return { success, dispose: async()=>{await up().catch(()=>{});await touch.detach()} }
}
module.exports={interact,sleep}
